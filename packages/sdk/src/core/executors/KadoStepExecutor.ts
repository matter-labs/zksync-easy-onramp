import { config, } from "@sdk/config";
import { BaseStepExecutor, } from "@sdk/core/executors/BaseStepExecutor";
import type {
  Process,
  ProcessType, Route, StepExtended,
} from "@sdk/types/sdk";

import { stopRouteExecution, } from "../execution";

// https://docs.kado.money/integrations/integrate-kado/the-hybrid-api/get-order-status
type KadoOrderStatus = {
  data: {
    paymentStatus: "pending" | "success" | "failed",
    transferStatus: "uninitiated" | "pending" | "failed" | "settled" | "unknown";
    humanStatusField: string;
  };
  message: string;
  success: boolean;
};

export class KadoStepExecutor extends BaseStepExecutor {
  constructor(route: Route, step: Route["steps"][number],) {
    super(route, step,);
  }

  async executeStep(): Promise<StepExtended> {
    console.log("Executing Kado step...",);
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
        throw new Error(`KADO_STEP_ERROR: ${e.message}`,);
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
      message: "Checking order status with Kado.",
    },);

    const kadoAPIUrl = config.get().dev ? "https://test-api.kado.money/v2/public/orders/" : "https://api.kado.money/v2/public/orders/";
    const orderStatusUrl = `${kadoAPIUrl}${orderId}`;

    return new Promise((resolve,) => {
      const checkingStatus = async (interval: NodeJS.Timeout,) => {
        const response = await fetch(orderStatusUrl,);
        const orderStatus: KadoOrderStatus = await response.json();

        if (this.stepManager.executionStopped) {
          clearInterval(interval,);
          resolve(process,);
        } else {
          if (orderStatus.data.paymentStatus === "pending") {
            this.stepManager.updateProcess({
              status: "PENDING",
              type: processType,
              message: "Payment is pending processing with Kado.",
            },);
          }
          if (orderStatus.data.paymentStatus === "success") {
            let message;
            switch (orderStatus.data.transferStatus) {
              case "uninitiated":
                message = "Payment successful. Transfer has not been initiated yet.";
                break;
              case "pending":
                message = "Payment successful. Waiting for transfer to settle with Kado.";
                break;
              case "failed":
                message = "Payment successful, however the transfer failed: " + orderStatus.data.humanStatusField;
                break;
              case "settled":
                message = "Payment successful. Kado transfer settled successfully.";
                break;
              case "unknown":
              default:
                message = `Transfer status unknown, contact Kado support for more information. Order ID: ${orderId} :: Message: ${orderStatus.data.humanStatusField}`;
                break;
            }

            if ([
              "settled",
              "unknown",
              "failed",
            ].includes(orderStatus.data.transferStatus,)) {
              clearInterval(interval,);
              resolve(this.stepManager.updateProcess({
                status: "DONE",
                type: processType,
                message,
              },),);
            } else {
              this.stepManager.updateProcess({
                status: "PENDING",
                type: processType,
                message: "Payment is pending processing with Kado.",
              },);
            }
          } else if (orderStatus.data.paymentStatus === "failed") {
            clearInterval(interval,);
            resolve(this.stepManager.updateProcess({
              status: "FAILED",
              type: processType,
              message: `${orderStatus.data.humanStatusField}`,
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
      message: "Complete payment process in Kado.pay window.",
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

        const { orderId, } = event.data.payload;
        if (orderId) {
          clearInterval(checkWindowClosed,);
          window.removeEventListener("message", onRampListener,);
          paymentWindow?.close();
          resolve(this.stepManager.updateProcess({
            status: "DONE",
            type: processType,
            message: "Payment completed with Kado. Order ID: " + orderId,
            params: { orderId, },
          },),);
        } else {
          ;
          resolve(this.stepManager.updateProcess({
            status: "FAILED",
            type: processType,
            message: "No Order ID was received from Kado.",
          },),);
        }
      };

      window.addEventListener("message", onRampListener,);
    },);
  }
}
