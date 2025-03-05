import type { RouteExtended as LifiRouteExtended, } from "@lifi/sdk";
import type {
  Process, ProcessStatus, ProcessType, StepExtended,
} from "@sdk/types/sdk";
import { cloneDeep, } from "lodash";

import { stopRouteExecution, } from "./execution";
import { executionState, } from "./executionState";

export type FindOrCreateProcess = {
  status: Process["status"],
  type: Process["type"],
  message: string
};

export type UpdateProcess = {
  status: ProcessStatus,
  type: ProcessType,
  message: string
  params?: Partial<Process>
};

export class StepManager {
  routeId: string;
  stepId: number;
  _step: StepExtended;

  constructor(step: StepExtended,) {
    this.routeId = step.id.split(":",)[0];
    this.stepId = +step.id.split(":",)[1];
    this._step = cloneDeep(step,);
    this.initExecution();
  }

  initExecution() {
    if (!this._step.execution) {
      this._step.execution = {
        status: "PENDING",
        process: [],
      };
    }

    if (this._step.execution.status === "FAILED") {
      this._step.execution.status = "PENDING";
    }
    this.updateStepInRoute();
  }

  get step() {
    return this._step;
  }

  get executionOptions() {
    return executionState.getExecutionOptions(this.routeId,) ?? {};
  }

  get executionStopped() {
    return !this.executionOptions.allowExecution;
  }

  get interactionDisabled() {
    return !this.executionOptions.executeInBackground;
  }

  get allStepsCompleted() {
    return this._step.execution!.process.every((p,) => p.status === "DONE",);
  }

  completeStep() {
    if (this.allStepsCompleted) {
      this._step.execution!.status = "DONE";
      this.updateStepInRoute();
    } else {
      this.updateStepInRoute(true,);
    }

    return this._step;
  }

  findOrCreateProcess(processParams: FindOrCreateProcess,): Process {
    const process = this.getProcessByType(processParams.type,);

    if (process) {
      return this.updateProcess(processParams,);
    }

    this._step.execution!.process.push(processParams,);
    return this.updateProcess(processParams,);
  }

  updateProcess({
    type,
    status,
    message,
    params,
  }: UpdateProcess,): Process {
    /**
     * If the process failed or cancelled, we update the step execution status to FAILED
     * and stop the route execution
     * If the process requires user interaction, if executeInBackground is false,
     * we stop the route execution
     */
    const process = this.getProcessByType(type,);
    if (!process) {
      throw new Error("Can't find a process for the given type.",);
    }

    switch (status) {
      case "FAILED":
        this._step.execution!.status = "FAILED";
        break;
      case "PENDING":
        this._step.execution!.status = "PENDING";
        break;
      case "ACTION_REQUIRED":
        this._step.execution!.status = "ACTION_REQUIRED";
        break;
      default:
        break;
    }

    process.status = status;
    process.message = message;

    if (params) {
      for (const [ key, value, ] of Object.entries(params,)) {
        process[key] = value;
      }
    }

    const stopRouteExecution = status === "FAILED" || (status === "ACTION_REQUIRED" && this.interactionDisabled);

    this.updateStepInRoute(stopRouteExecution,);
    return process;
  }

  updateStepInRoute(stopExecution = false,) {
    const executionData = executionState.get(this.routeId,);
    if (executionData) {
      executionData.route.steps[this.stepId] = this._step;
      if (stopExecution) {
        stopRouteExecution(this.routeId,);
      } else {
        executionState.update(this.routeId,{ route: executionData.route, },);
      }
    }
  }

  /**
   * Injects the lifi steps into the route
   * This expects the array of steps to include *only*
   * a single step.
   * The assumption being that this is a lifi quote
   * not a lifi route.
   * https://docs.li.fi/integrate-li.fi-sdk/request-routes-quotes#difference-between-route-and-quote
   */
  injectLifiSteps(route: LifiRouteExtended,) {
    const updatedRoute = executionState.get(this.routeId,)!.route;
    this._step = {
      ...route.steps[0] as unknown as StepExtended,
      id: `${this.routeId}:${this.stepId}`,
    };
    updatedRoute.steps[this.stepId] = {
      ...this._step,
      lifiRoute: route,
    };
    executionState.update(this.routeId,{ route: updatedRoute, },);
  }

  getProcessByType(type: ProcessType,): Process | null {
    if (!this._step.execution) {
      throw new Error("Can't find a process in an empty execution",);
    }

    return this._step.execution.process.find((p,) => p.type === type,) ?? null;
  }

}
