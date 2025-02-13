import { executionState, } from "@sdk/core/executionState";
import { StepManager, } from "@sdk/core/StepManager";
import type { Route, StepExtended, } from "@sdk/types/sdk";
import { cloneDeep, } from "lodash";

export abstract class BaseStepExecutor {
  routeId: Route["id"];
  // step: Route["steps"][number];
  stepManager: StepManager;

  constructor(route: Route, step: Route["steps"][number],) {
    this.routeId = route.id;
    this.stepManager = new StepManager(cloneDeep(step,),);
  }

  get route(): Route {
    return executionState.get(this.routeId,)!.route;
  }

  abstract executeStep(stepIndex: number): Promise<StepExtended>;
}
