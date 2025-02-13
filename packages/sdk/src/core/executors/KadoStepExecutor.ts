import { config, } from "@sdk/config";
import { BaseStepExecutor, } from "@sdk/core/executors/BaseStepExecutor";
import type {
  ProcessType, Route, StepExtended,
} from "@sdk/types/sdk";

type KadoTransferStatus = "uninitiated" | "pending" | "failed" | "settled" | "unknown";

export class KadoStepExecutor extends BaseStepExecutor {
  constructor(route: Route, step: Route["steps"][number],) {
    super(route, step,);
  }

  async executeStep(): Promise<StepExtended> {
    console.log("Executing Kado step...",);
    const step = this.stepManager.step;
    if (step.type === "onramp_via_link") {
      try {
        const externalProcess = this.stepManager.getProcessByType( "EXTERNAL",);
        if (externalProcess?.status !== "DONE") {
          await this.openOnRampLink();
        }
        await this.checkOrderStatus();
      } catch (e: any) {
        throw new Error(`KADO_STEP_ERROR: ${e.message}`,);
      }
    }
    return this.stepManager.step;
  }

  /**
   * Checks the status of the order with the given orderId
   * Polls ever few seconds to receive the status of the order.
   * When the `paymentStatus` is either "success" or "failed" the process is marked as done and polling stops.
   */
  async checkOrderStatus(): Promise<any> {
    const orderId = this.stepManager.getProcessByType("EXTERNAL",)?.orderId;
    if (!orderId) {
      throw new Error("No Order ID provided to check status.",);
    }
    const kadoAPIUrl = config.get().dev ? "https://test-api.kado.money/v2/public/orders/" : "https://api.kado.money/v2/public/orders/";
    const orderStatusUrl = `${kadoAPIUrl}${orderId}`;
    const processType: ProcessType = "STATUS_CHECK";
    this.stepManager.findOrCreateProcess({
      status: "STARTED",
      type: processType,
      message: "Checking order status with Kado",
    },);

    return new Promise((resolve,) => {
      const checkingStatus = async (interval: NodeJS.Timeout,) => {
        const response = await fetch(orderStatusUrl,);
        const orderStatus = await response.json();

        if (orderStatus.data.paymentStatus === "pending") {
          this.stepManager.updateProcess({
            status: "PENDING",
            type: processType,
            message: "Payment is pending processing with Kado.",
          },);
        }
        if (orderStatus.data.paymentStatus === "success") {
          let message;
          switch (orderStatus.data.transferStatus as KadoTransferStatus) {
            case "pending":
              message = "Waiting for transaction to settle with Kado.";
              break;
            case "failed":
              message = "Transfer failed: " + orderStatus.data.humanStatusField;
              break;
            case "settled":
              message = "Kado transfer settled successfully.";
              break;
            case "unknown":
            default:
              message = `Transfer status unknown, contact Kado support for more information. Message: ${orderStatus.data.humanStatusField}:: Order ID: ${orderId}`;
              break;
          }

          if ([
            "settled",
            "unknown",
            "failed",
          ].includes(orderStatus.data.transferStatus,)) {
            this.stepManager.updateProcess({
              status: "DONE",
              type: processType,
              message,
            },);
            clearInterval(interval,);
            resolve(this.stepManager.updateExecution({ status: "DONE", },),);
          } else {
            this.stepManager.updateProcess({
              status: "PENDING",
              type: processType,
              message: "Payment is pending processing with Kado.",
            },);
          }
        } else if (orderStatus.data.paymentStatus === "failed") {
          this.stepManager.updateProcess({
            status: "FAILED",
            type: processType,
            message: "Payment processing with Kado failed.",
          },);
          clearInterval(interval,);
          resolve(this.stepManager.updateExecution({ status: "FAILED", },),);
        }
      };

      const checkInterval = setInterval(async () => {
        await checkingStatus(checkInterval,);
      }, 3000,);
    },);
  }

  async openOnRampLink(): Promise<string> {
    return new Promise((resolve, reject,) => {
      const processType: ProcessType = "EXTERNAL";
      this.stepManager.findOrCreateProcess({
        status: "PENDING",
        type: processType,
        message: "Opening Kado payment window.",
      },);
      const paymentWindow = window.open(this.stepManager.step.link, "_blank", "width=600,height=800",);

      if (!paymentWindow) {
        this.stepManager.updateProcess({
          status: "FAILED",
          type: processType,
          message: "Payment window failed to open.",
        },);
        this.stepManager.updateExecution({ status: "FAILED", },);
        reject(new Error("Payment window failed to open.",),);
        return;
      }

      const checkWindowClosed = setInterval(() => {
        if (paymentWindow?.closed) {
          clearInterval(checkWindowClosed,);
          window.removeEventListener("message", onRampListener,);
          this.stepManager.updateProcess({
            status: "CANCELLED",
            type: processType,
            message: "Payment window was closed before completing the process.",
          },);
          this.stepManager.updateExecution({ status: "FAILED", },);
          reject(new Error("Payment window was closed before completing the process.",),);
        }
      }, 1000,);

      const onRampListener = (event: { origin: string; data: { payload: { orderId: string; }; }; },) => {
        if (event.origin !== new URL(this.stepManager.step.link,).origin) {
          return;
        }

        const { orderId, } = event.data.payload;
        if (orderId) {
          clearInterval(checkWindowClosed,);
          window.removeEventListener("message", onRampListener,);
          this.stepManager.updateProcess({
            status: "DONE",
            type: processType,
            message: "Payment completed with Kado. Order ID: " + orderId,
            params: { orderId, },
          },);
          this.stepManager.updateExecution({ status: "DONE", },);
          resolve(orderId,);
          paymentWindow?.close();
        } else {
          this.stepManager.updateProcess({
            status: "FAILED",
            type: processType,
            message: "No Order ID was received from Kado.",
          },);
          this.stepManager.updateExecution({ status: "FAILED", },);
          reject(new Error("No order ID was received from Kado",),);
        }
      };

      window.addEventListener("message", onRampListener,);
    },);
  }
}
