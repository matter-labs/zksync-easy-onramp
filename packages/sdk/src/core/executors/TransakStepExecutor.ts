import { config, } from "@sdk/config";
import { BaseStepExecutor, } from "@sdk/core/executors/BaseStepExecutor";
import type {
  Process,
  ProcessType, Route, StepExtended,
} from "@sdk/types/sdk";

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
          return this.stepManager.step;
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

      const originalLink = new URL(this.stepManager.step.link as string,);
      originalLink.searchParams.set("redirectURL", window.location.origin,);

      const paymentWindow = window.open(originalLink.toString(), "_blank", "width=600,height=800",);
      if (!paymentWindow) {
        return resolve(
          this.stepManager.updateProcess({
            status: "FAILED",
            type: processType,
            message: "Payment window failed to open.",
          },),
        );
      }

      const checkWindowClosed = setInterval(() => {
        if (!paymentWindow || paymentWindow.closed) {
          clearInterval(checkWindowClosed,);
          clearInterval(checkURLPoll,);

          return resolve(
            this.stepManager.updateProcess({
              status: "CANCELLED",
              type: processType,
              message: "Payment window was closed before completing the process.",
            },),
          );
        }
      }, 1000,);

      const checkURLPoll = setInterval(() => {
        try {
          const href = paymentWindow?.location.href;
          if (!href || !href.startsWith(window.location.origin,)) return;

          const url = new URL(href,);
          const orderId = url.searchParams.get("orderId",);
          const status = url.searchParams.get("status",) as OnrampOrderStatusCode | null;

          if (orderId && status) {
            clearInterval(checkWindowClosed,);
            clearInterval(checkURLPoll,);
            paymentWindow?.close();

            switch (status) {
              case "COMPLETED":
              case "AWAITING_PAYMENT_FROM_USER":
              case "ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK":
              case "PAYMENT_DONE_MARKED_BY_USER":
              case "PENDING_DELIVERY_FROM_TRANSAK":
              case "PROCESSING":
                return resolve(
                  this.stepManager.updateProcess({
                    status: "DONE",
                    type: processType,
                    message: `Payment completed with Transak. Order ID: ${orderId}`,
                    params: { orderId, },
                  },),
                );
                break;
              case "FAILED":
              case "CANCELLED":
              case "EXPIRED":
              case "REFUNDED":
                return resolve(
                  this.stepManager.updateProcess({
                    status: "FAILED",
                    type: processType,
                    message: `Payment failed with Transak. Order ID: ${orderId}`,
                    params: { orderId, },
                  },),
                );
                break;

              default:
                return resolve(
                  this.stepManager.updateProcess({
                    status: "FAILED",
                    type: processType,
                    message: `Unknown order status received from Transak. Order ID: ${orderId}`,
                    params: { orderId, },
                  },),
                );
                break;
            }
          }
        } catch (err) {
          // Ignore cross-origin errors until redirected to same origin
          if (err instanceof DOMException && err.name === "SecurityError") return;
          console.error("Error checking payment window URL:", err,);
        }
      }, 1000,);
    },);
  }
}
