import type { LiFiErrorCode, RouteExtended, } from "@lifi/sdk";
import {
  convertQuoteToRoute, ErrorMessage, executeRoute as executeLifiRoute, resumeRoute as resumeLifiRoute,
} from "@lifi/sdk";
import type { Route, StepExtended, } from "@sdk/types/sdk";

import { BaseStepExecutor, } from "./BaseStepExecutor";

export class LifiStepExecutor extends BaseStepExecutor {
  constructor(route: Route, step: Route["steps"][number],) {
    super(route, step,);
  }

  async executeStep(): Promise<StepExtended> {
    let updatedRoute;
    try {
      if (this.stepManager.step.lifiRoute) {
        console.log("Resuming Lifi step...",);
        updatedRoute = await resumeLifiRoute(this.stepManager.step.lifiRoute, {
          updateRouteHook: this.onUpdateHook.bind(this,),
          executeInBackground: this.stepManager.executionOptions.executeInBackground,
        },);
      } else {
        console.log("Executing Lifi step...",);
        const quote = convertQuoteToRoute(this.stepManager.step.swapQuote!,);
        updatedRoute = await executeLifiRoute(quote, {
          updateRouteHook: this.onUpdateHook.bind(this,),
          executeInBackground: this.stepManager.executionOptions.executeInBackground,
        },);
      }
      this.stepManager.injectLifiSteps(updatedRoute,);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e: unknown) {
      console.log("Error thrown in LiFI execution",);
    } finally {
      return this.stepManager.completeStep();
    }
  }

  onUpdateHook(route: RouteExtended,) {
    console.log("[sdk] receive lifi hook update",);
    this.processRoute(route,);
  }

  processRoute(route: RouteExtended,) {
    // get the last process in route.steps[0].execution
    // update our step status with the lifi status
    // because not all errors will have a readable message.
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
