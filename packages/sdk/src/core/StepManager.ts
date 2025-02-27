import type { RouteExtended, } from "@lifi/sdk";
import type {
  ExecutionStatus, Process, ProcessStatus, ProcessType, StepExtended,
} from "@sdk/types/sdk";
import { cloneDeep, } from "lodash";

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
    this._step = step;
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
    return cloneDeep(this._step,);
  }

  updateExecution({ status, }: { status: ExecutionStatus, },) {
    if (!this._step.execution) {
      throw Error("Can't update empty execution.",);
    }
    this._step.execution.status = status;
    this.updateStepInRoute();
  }

  findOrCreateProcess({
    status,
    type,
    message,
  }: FindOrCreateProcess,): Process {
    if (!this._step.execution?.process) {
      throw new Error("Execution hasn't been initialized.",);
    }

    const process = this.getProcessByType(type,);

    if (process) {
      if (status && process.status !== status) {
        process.status = status;
        this.updateStepInRoute();
      }
      return process;
    }

    const newProcess: Process = {
      type: type,
      status: status ?? "STARTED",
      message,
    };

    this._step.execution.process.push(newProcess,);
    this.updateStepInRoute();
    return newProcess;
  }

  updateProcess({
    type,
    status,
    message,
    params,
  }: UpdateProcess,) {
    if (!this._step.execution) {
      throw new Error("Can't update an empty step execution.",);
    }
    const currentProcess = this.getProcessByType(type,);

    if (!currentProcess) {
      throw new Error("Can't find a process for the given type.",);
    }

    switch (status) {
      case "FAILED":
        this._step.execution.status = "FAILED";
        break;
      case "PENDING":
        this._step.execution.status = "PENDING";
        break;
      case "ACTION_REQUIRED":
        this._step.execution.status = "ACTION_REQUIRED";
        break;
      default:
        break;
    }

    currentProcess.status = status;
    currentProcess.message = message;

    if (params) {
      for (const [ key, value, ] of Object.entries(params,)) {
        currentProcess[key] = value;
      }
    }

    this.updateStepInRoute();
    return this._step;
  }

  updateStepInRoute() {
    const updatedRoute = executionState.get(this.routeId,)!.route;
    const stepIndex = updatedRoute.steps.findIndex((step,) => step.id === `${this.routeId}:${this.stepId}`,);
    updatedRoute.steps[stepIndex] = this._step;
    executionState.update(this.routeId,{ route: updatedRoute, },);
  }

  /**
   * Injects the lifi steps into the route
   * This expects the array of steps to include *only*
   * a single step. The assumption being that this is a lifi quote
   * not a lifi route.
   * https://docs.li.fi/integrate-li.fi-sdk/request-routes-quotes#difference-between-route-and-quote
   */
  injectLifiSteps(route: RouteExtended,) {
    const updatedRoute = executionState.get(this.routeId,)!.route;
    updatedRoute.steps[this.stepId] = {
      ...route.steps[0] as unknown as StepExtended,
      id: this._step.id,
      lifiRoute: route,
    };
    executionState.update(this.routeId,{ route: updatedRoute, },);
  }

  getProcessByType(type: ProcessType,): Process | null {
    if (!this._step.execution) {
      throw new Error("Can't find process in an empty execution.",);
    }

    return this._step.execution.process.find((p,) => p.type === type,) ?? null;
  }
}
