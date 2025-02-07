import type { StepExtended, } from "@sdk/types/sdk";

import type { ExecutionState, } from "./state";
import { executeOnRampLinkStep, } from "./steps";

export class StepManager {
  execution: ExecutionState;

  constructor(executionState: ExecutionState,) {
    this.execution = executionState;
  }

  initStep(step: StepExtended,) {
    if (!step.execution) {
      step.execution = { status: "PENDING", };
    }
    if (step.execution.status === "FAILED") {
      step.execution.status = "PENDING";
    }
    this.updateStep();
  }

  async executeSteps() {
    for (let i = 0; i < this.execution.route.steps.length; i++) {
      const activeStep = this.execution.route.steps[i];
      this.initStep(activeStep,);
      try {
        if (this.execution.route.provider.key === "kado") {
          if (activeStep.type === "onramp_via_link") {
            activeStep.execution!.message = "Opening process in a new window";
            const orderId = await executeOnRampLinkStep(activeStep,);
            console.log("received order id", orderId,);
            activeStep.execution = { status: "DONE", };
          }
        }
      } catch (error: any) {
        activeStep.execution!.status = "FAILED";
        activeStep.execution!.message = error.message;
        throw new Error(`STEP_ERROR: ${error.message}`,);
      } finally {
        this.updateStep();
      }
    }
  }

  updateStep() {
    this.execution.options.onUpdateHook?.(this.execution,);
  }

}
