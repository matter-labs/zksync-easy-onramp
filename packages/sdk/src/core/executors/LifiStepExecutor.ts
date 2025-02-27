import type { LiFiErrorCode, RouteExtended, } from "@lifi/sdk";
import {
  convertQuoteToRoute, ErrorMessage, executeRoute, resumeRoute,
} from "@lifi/sdk";
import type { Route, StepExtended, } from "@sdk/types/sdk";

import { BaseStepExecutor, } from "./BaseStepExecutor";

export class LifiStepExecutor extends BaseStepExecutor {
  constructor(route: Route, step: Route["steps"][number],) {
    super(route, step,);
  }

  async executeStep(): Promise<StepExtended> {
    console.log("Executing Lifi step...", this.stepManager.step,);

    if (this.stepManager.step.lifiRoute) {
      await resumeRoute(this.stepManager.step.lifiRoute, { updateRouteHook: this.onUpdateHook.bind(this,), },);
    } else {
      const quote = convertQuoteToRoute(this.stepManager.step.swapQuote!,);
      await executeRoute(quote, { updateRouteHook: this.onUpdateHook.bind(this,), },);
    }

    return this.stepManager.step;
  }

  onUpdateHook(route: RouteExtended,) {
    this.processRoute(route,);
  }

  processRoute(route: RouteExtended,) {
    // get the last process in route.steps[0].execution
    // update our step status with the lifi status
    const lastProcess = route.steps[0].execution?.process?.[route.steps[0].execution.process.length - 1];
    if (lastProcess && lastProcess.status === "FAILED" && !lastProcess.message) {
      switch (lastProcess.error?.code as LiFiErrorCode) {
        case 1002:
          lastProcess.message = ErrorMessage.TransactionUnderpriced;
          break;
        case 1003:
          lastProcess.message = ErrorMessage.TransactionReverted;
          break;
        case 1007:
          lastProcess.message = "Chain switch is required.";
          break;
        case 1009:
          lastProcess.message = ErrorMessage.GasLimitLow;
          break;
        case 1010:
          lastProcess.message = "Transaction was cancelled.";
          break;
        case 1011:
          lastProcess.message = ErrorMessage.SlippageError;
          break;
        case 1012:
          lastProcess.message = "Signature required.";
          break;
        case 1013:
          lastProcess.message = "The balance is too low to complete transaction.";
          break;
        case 1015:
          lastProcess.message = "Insufficient funds to complete transaction.";
          break;
        case 1017:
          lastProcess.message = "Wallet was changed during execution.";
          break;
        default:
          lastProcess.message = "Action failed.";
          break;
      }
    }

    this.stepManager.injectLifiSteps(route,);
  }
}
