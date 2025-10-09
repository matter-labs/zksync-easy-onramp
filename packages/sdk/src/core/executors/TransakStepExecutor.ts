import { config, } from "@sdk/config";
import { BaseStepExecutor, } from "@sdk/core/executors/BaseStepExecutor";
import type {
  Process,
  ProcessType, Route, StepExtended,
} from "@sdk/types/sdk";
import { Transak, type TransakConfig, } from "@transak/transak-sdk";

import { stopRouteExecution, } from "../execution";

// https://docs.transak.com/docs/tracking-user-kyc-and-order-status
type OnrampOrderStatusCode =
 | "AWAITING_PAYMENT_FROM_USER"             // When the order is created but the payment still not received
 | "PAYMENT_DONE_MARKED_BY_USER"            // When the user marks the payment as done but it is received by us yet
 | "PROCESSING"                             // Orders in the PROCESSING state have passed the checks and the user's payment information has been validated
 | "PENDING_DELIVERY_FROM_TRANSAK"          // When the payment is received and being exchanged & transferred via us or our liquidity partner
 | "ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK"  // Order is on hold
 | "COMPLETED"                              // When we have received the payment and the crypto is sent successfully to the user
 | "CANCELLED"                              // Order is cancelled
 | "FAILED"                                 // When the order is failed, e.g.: because of the card decline
 | "REFUNDED"                               // Order is refunded to the user
 | "EXPIRED";                               // When the user failed to make the payment within the timeframe.

type TransakOrderStatus = {
  status: OnrampOrderStatusCode;
  statusMessage?: string;
  fiatCurrency: string;
  cryptoCurrency: string;
  isBuyOrSell: "BUY" | "SELL";
  fiatAmount: number;
  amountPaid: number;
  cryptoAmount: number;
  conversionPrice: number;
  totalFeeInFiat: number;
  network: string;
  autoExpiresAt: string;
  createdAt: string;
  completedAt?: string;
};

export async function fetchTransakOrderStatus(orderId: string,): Promise<TransakOrderStatus> {
  const apiUrl = config.get().apiUrl;
  const url = new URL(`${apiUrl}/order-status/transak`,);
  url.searchParams.append("orderId", orderId,);
  if (config.get().dev) {
    url.searchParams.append("dev", "true",);
  }

  const results = await fetch(url,)
    .then((response,) => response.json(),)
    .then((data,) => {
      return data;
    },)
    .catch((error,) => {
      throw error;
    },);

  return results;
}

export class TransakStepExecutor extends BaseStepExecutor {
  constructor(route: Route, step: Route["steps"][number],) {
    super(route, step,);
  }

  async executeStep(): Promise<StepExtended> {
    console.log("Executing Transak step...",);
    const step = this.stepManager.step;

    if (step.type === "onramp_via_link") {
      try {
        const process = await this.openOnRampLink();
        if (process.status !== "DONE") {
          stopRouteExecution(this.stepManager.routeId,);
          return step;
        }
        await this.checkOrderStatus(process.orderId!,);
      } catch (e: any) {
        throw new Error(`TRANSAK_STEP_ERROR: ${e.message}`,);
      }
    }

    return this.stepManager.completeStep();
  }

  async checkOrderStatus(orderId: string,): Promise<Process> {
    if (!orderId) {
      throw new Error("No Order ID provided to check status.",);
    }

    const processType: ProcessType = "STATUS_CHECK";
    const process = this.stepManager.findOrCreateProcess({
      status: "PENDING",
      type: processType,
      message: "Checking order status with Transak.",
    },);

    return new Promise((resolve,) => {
      const checkingStatus = async (interval: NodeJS.Timeout,) => {
        const orderStatus: TransakOrderStatus = await fetchTransakOrderStatus(orderId,);

        if (this.stepManager.executionStopped) {
          clearInterval(interval,);
          return resolve(process,);
        } else {
          if (orderStatus.status === "AWAITING_PAYMENT_FROM_USER" || orderStatus.status === "PAYMENT_DONE_MARKED_BY_USER") {
            this.stepManager.updateProcess({
              status: "PENDING",
              type: processType,
              message: "Transak order is awaiting for payment.",
            },);
          } else if (orderStatus.status === "PROCESSING" || orderStatus.status === "PENDING_DELIVERY_FROM_TRANSAK") {
            this.stepManager.updateProcess({
              status: "PENDING",
              type: processType,
              message: "Payment is pending processing with Transak.",
            },);
          } else if (orderStatus.status === "ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK") {
            this.stepManager.updateProcess({
              status: "PENDING",
              type: processType,
              message: `Order is on hold pending delivery from Transak. Order ID: ${orderId}`,
            },);
          } else if (orderStatus.status === "COMPLETED") {
            clearInterval(interval,);
            return resolve(this.stepManager.updateProcess({
              status: "DONE",
              type: processType,
              message: "Payment completed successfully.",
              params: {
                toAmount: orderStatus.cryptoAmount,
                toToken: orderStatus.cryptoCurrency,
                fromAmount: orderStatus.fiatAmount,
                fromCurrency: orderStatus.fiatCurrency,
              },
            },),);
          } else if (orderStatus.status === "CANCELLED") {
            clearInterval(interval,);
            return resolve(this.stepManager.updateProcess({
              status: "CANCELLED",
              type: processType,
              message: "Payment was cancelled.",
            },),);
          } else if (orderStatus.status === "EXPIRED") {
            clearInterval(interval,);
            return resolve(this.stepManager.updateProcess({
              status: "CANCELLED",
              type: processType,
              message: "Order expired.",
            },),);
          } else if (orderStatus.status === "REFUNDED") {
            clearInterval(interval,);
            return resolve(this.stepManager.updateProcess({
              status: "CANCELLED",
              type: processType,
              message: "Order was refunded.",
            },),);
          } else if (orderStatus.status === "FAILED") {
            clearInterval(interval,);
            return resolve(this.stepManager.updateProcess({
              status: "FAILED",
              type: processType,
              message: "Order failed: " + orderStatus.statusMessage,
            },),);
          }
        }
      };

      const checkInterval = setInterval(async () => {
        await checkingStatus(checkInterval,);
      }, 3000,);
    },);
  }

  async openOnRampLink(): Promise<Process> {
    const processType: ProcessType = "EXTERNAL";
    const process = this.stepManager.findOrCreateProcess({
      status: "ACTION_REQUIRED",
      type: processType,
      message: "Complete payment process in Transak window.",
    },);

    return new Promise((resolve,) => {
      if (process.status === "DONE" && !!process.orderId) {
        return resolve(process,);
      }

      if (this.stepManager.executionStopped || this.stepManager.interactionDisabled) {
        return resolve(process,);
      }

      // Configure Transak SDK
      const transakConfig: TransakConfig = {
        widgetUrl: this.stepManager.step.link as string,
        referrer: `${window.location.protocol}//${window.location.host}`,
      };
      const transak = new Transak(transakConfig,);

      // Initialize Transak widget
      transak.init();

      // Handle widget close event
      Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
        transak.close();

        // Only resolve as cancelled if we haven't already resolved
        return resolve(
          this.stepManager.updateProcess({
            status: "CANCELLED",
            type: processType,
            message: "Payment window was closed before completing the process.",
          },),
        );
      },);

      // Handle successful order event
      Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData: any,) => {
        // Validate orderData has required fields
        if (orderData && typeof orderData === "object" && "id" in orderData && "status" in orderData) {
          const orderId = orderData.id;

          transak.close();

          return resolve(
            this.stepManager.updateProcess({
              status: "DONE",
              type: processType,
              message: `Payment completed with Transak. Order ID: ${orderId}`,
              params: { orderId, },
            },),
          );
        } else {
          console.error("Invalid orderData received:", orderData,);
          transak.close();

          return resolve(
            this.stepManager.updateProcess({
              status: "FAILED",
              type: processType,
              message: "Invalid order data received from Transak.",
            },),
          );
        }
      },);

      Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE_REQUEST, () => {
        transak.close();

        return resolve(
          this.stepManager.updateProcess({
            status: "CANCELLED",
            type: processType,
            message: "Payment window was closed.",
          },),
        );
      },);

      // Handle order failure event
      Transak.on(Transak.EVENTS.TRANSAK_ORDER_FAILED, (orderData: any,) => {
        const orderId = orderData?.id || "unknown";
        transak.close();
        return resolve(
          this.stepManager.updateProcess({
            status: "FAILED",
            type: processType,
            message: `Payment failed with Transak. Order ID: ${orderId}`,
            params: { orderId, },
          },),
        );
      },);

      // Handle order cancellation event
      Transak.on(Transak.EVENTS.TRANSAK_ORDER_CANCELLED, () => {
        transak.close();

        return resolve(
          this.stepManager.updateProcess({
            status: "CANCELLED",
            type: processType,
            message: "Order was cancelled.",
          },),
        );
      },);
    },);
  }
}
