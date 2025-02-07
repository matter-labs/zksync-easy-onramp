import type { Route, } from "@sdk/types/sdk";
import type { ProviderQuoteOption, } from "@sdk/types/server";
import { cloneDeep, } from "radashi";

import { StepManager, } from "./stepManager";

export type ExecutionOptions = {
  onUpdateHook?: (state: ExecutionState) => void;
};

export class ExecutionState {
  status: "PENDING" | "IN_PROGRESS" | "FAILED" | "DONE" | "CANCELLED";
  route: Route;
  options: ExecutionOptions;
  executionPromise: Promise<this> | null = null;

  constructor(quote: ProviderQuoteOption, options = {},) {
    this.status = "PENDING";
    this.route = cloneDeep(quote as Route,);
    this.options = options;
  }

  execute() {
    if (!!this.executionPromise) {
      return this.executionPromise;
    }
    this.executionPromise = this.executeSteps();
    return this.executionPromise;
  }

  async executeSteps() {
    this.status = "IN_PROGRESS";
    this.options.onUpdateHook?.(this,);
    const stepManager = new StepManager(this,);
    try {
      await stepManager.executeSteps();
    } catch (error: any) {
      this.status = "FAILED";
      this.options.onUpdateHook?.(this,);
      throw new Error(`EXECUTION_ERROR: ${error.message}`,);
    }
    this.status = "DONE";
    return this;
  }
}
