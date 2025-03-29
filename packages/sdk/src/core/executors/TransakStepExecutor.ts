import { config, } from "@sdk/config";
import { BaseStepExecutor, } from "@sdk/core/executors/BaseStepExecutor";
import type {
  Process,
  ProcessType, Route, StepExtended,
} from "@sdk/types/sdk";

import { stopRouteExecution, } from "../execution";

// type WindowEvents =
//  | "TRANSAK_WIDGET_CLOSE"
//  | "TRANSAK_WIDGET_INITIALISED"
//  | "TRANSAK_WIDGET_OPEN"
//  | "TRANSAK_ORDER_CREATED"
//  | "TRANSAK_ORDER_CANCELLED"
//  | "TRANSAK_ORDER_FAILED"
//  | "TRANSAK_ORDER_SUCCESSFUL";

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
        await this.checkOrderStatus(process.orderId,);
      } catch (e: any) {
        throw new Error(`TRANSAK_STEP_ERROR: ${e.message}`,);
      }
    }

    return this.stepManager.completeStep();
  }

  /**
   * Checks the status of the order with the given orderId
   * Polls every few seconds to receive the status of the order.
   * When the `paymentStatus` is either "success" or "failed" the process is marked as done and polling stops.
   */
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

    const transakAPIUrl = config.get().dev ? "https://test-api.kado.money/v2/public/orders/" : "https://api.kado.money/v2/public/orders/";
    const orderStatusUrl = `${transakAPIUrl}${orderId}`;

    return new Promise((resolve,) => {
      const checkingStatus = async (interval: NodeJS.Timeout,) => {
        const response = await fetch(orderStatusUrl,);
        const orderStatus: TransakOrderStatus = await response.json();

        if (this.stepManager.executionStopped) {
          clearInterval(interval,);
          resolve(process,);
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
            resolve(this.stepManager.updateProcess({
              status: "DONE",
              type: processType,
              message: "Payment completed successfully.",
            },),);
          } else if (orderStatus.status === "CANCELLED") {
            clearInterval(interval,);
            resolve(this.stepManager.updateProcess({
              status: "CANCELLED",
              type: processType,
              message: "Payment was cancelled.",
            },),);
          } else if (orderStatus.status === "EXPIRED") {
            clearInterval(interval,);
            resolve(this.stepManager.updateProcess({
              status: "CANCELLED",
              type: processType,
              message: "Order expired.",
            },),);
          } else if (orderStatus.status === "REFUNDED") {
            clearInterval(interval,);
            resolve(this.stepManager.updateProcess({
              status: "CANCELLED",
              type: processType,
              message: "Order was refunded.",
            },),);
          } else if (orderStatus.status === "FAILED") {
            clearInterval(interval,);
            resolve(this.stepManager.updateProcess({
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
        resolve(process,);
      }

      if (this.stepManager.executionStopped) {
        resolve(process,);
      }

      if (this.stepManager.interactionDisabled) {
        resolve(process,);
      }

      const paymentWindow = window.open(this.stepManager.step.link as string, "_blank", "width=600,height=800",);
      if (!paymentWindow) {
        resolve(this.stepManager.updateProcess({
          status: "FAILED",
          type: processType,
          message: "Payment window failed to open.",
        },),);
      }

      const checkWindowClosed = setInterval(() => {
        if (paymentWindow?.closed) {
          clearInterval(checkWindowClosed,);
          window.removeEventListener("message", onRampListener,);

          resolve(this.stepManager.updateProcess({
            status: "CANCELLED",
            type: processType,
            message: "Payment window was closed before completing the process.",
          },),);
        }
      }, 1000,);

      const onRampListener = (event: { origin: string; data: { payload: { orderId: string; }; }; },) => {
        if (event.origin !== new URL(this.stepManager.step.link as string,).origin) {
          return;
        }

        console.log("Transak event received: ", event,);
        /* const { orderId, } = event.data.payload;
        if (orderId) {
          clearInterval(checkWindowClosed,);
          window.removeEventListener("message", onRampListener,);
          paymentWindow?.close();
          resolve(this.stepManager.updateProcess({
            status: "DONE",
            type: processType,
            message: "Payment completed with Transak. Order ID: " + orderId,
            params: { orderId, },
          },),);
        } else {
          resolve(this.stepManager.updateProcess({
            status: "FAILED",
            type: processType,
            message: "No Order ID was received from Transak.",
          },),);
        } */
      };

      window.addEventListener("message", onRampListener,);
    },);
  }
}
