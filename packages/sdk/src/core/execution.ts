import type { ExecutionData, ExecutionOptions, } from "@sdk/core/executionState";
import { executionState, } from "@sdk/core/executionState";
import type { Route, } from "@sdk/types/sdk";
import type { ProviderQuoteOption, } from "@sdk/types/server";

import { getExecutor, } from "./executors/ExecutorFactory";

export async function executeRoute(quote: ProviderQuoteOption | Route, executionOptions?: ExecutionOptions,): Promise<Route> {
  if (quote.id) {
    const executionData = executionState.get(quote.id,);
    if (!!executionData?.promise) {
      return executionData.promise;
    }
  }

  const executionData = executionState.set({ ...(quote as ProviderQuoteOption), status: "RUNNING", }, executionOptions,);
  const executionPromise = executeSteps(executionData,);
  executionState.update(executionData.route.id,{ promise: executionPromise, },);

  return executionPromise;
}

export function stopRouteExecution(executingRoute: Route,): void {
  executionState.update(executingRoute.id,{ route: { ...executingRoute, status: "HALTING", }, executionOptions: { allowExecution: false, }, },);
  const executionData = executionState.get(executingRoute.id,);
  console.log("stopping route", executionData?.route,);

  return;
}

export async function resumeRouteExecution(route: Route, executionOptions?: ExecutionOptions,): Promise<Route> {
  if (!route.id) {
    return Promise.reject({ error: new Error("Quote does not have an id. Please call executeRoute instead.",), route, },);
  }

  const executionData = executionState.get(route.id,);
  if (executionData) {
    return executionData.promise!;
  }

  const restartedRoute = await restartRoute(route,);

  return executeRoute(restartedRoute, executionOptions,);
}

async function restartRoute(route: Route,): Promise<Route> {
  for (let index = 0; index < route.steps.length; index++) {
    const step = route.steps[index];

    if (step.execution) {
      step.execution.process = step.execution.process.filter(
        (process,) => process.status === "DONE",
      );
    }
  }

  return route;
}

async function executeSteps(executionData: ExecutionData,): Promise<Route> {
  // TODO: Define the executor by each step instead of at the route level.
  for (let i = 0; i < executionData.route.steps.length; i++) {
    const step = executionData.route.steps[i];
    if (step.execution?.status === "DONE") {
      continue;
    }
    const executor = getExecutor(executionData.route, executionData.route.steps[i],);
    try {
      await executor.executeStep();

      const _executionData = executionState.get(executionData.route.id,);
      if (_executionData && !_executionData.executionOptions?.allowExecution) {
        console.log("[sdk] Execution stopped in executeSteps",);
        executionState.delete(_executionData.route.id,);
        _executionData.route.status = "HALTED";
        return Promise.resolve(_executionData.route,);
      }
    } catch (e:any) {
      stopRouteExecution(executionData.route,);
      executionState.delete(executionData.route.id,);
      Promise.reject({ error: e, route: executionData.route, },);
    }
  }
  const _executionData = executionState.get(executionData.route.id,);
  _executionData!.route.status = "DONE";
  return Promise.resolve(_executionData!.route,);
}
