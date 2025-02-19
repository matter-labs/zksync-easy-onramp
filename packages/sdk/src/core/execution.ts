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

  const executionData = executionState.set((quote as ProviderQuoteOption), executionOptions,);
  const executionPromise = executeSteps(executionData,);
  executionState.update(executionData.route.id,{ promise: executionPromise, },);

  return executionPromise;
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
    } catch (e:any) {
      stopRouteExecution(executionData.route,);
      throw e;
    }
  }
  const _executionData = executionState.get(executionData.route.id,);
  return Promise.resolve(_executionData!.route,);
}

function stopRouteExecution(executingRoute: Route,) {
  const executionData = executionState.get(executingRoute.id,);
  if (!executionData) {
    return executingRoute;
  }

  executionState.delete(executingRoute.id,);
  return executionData.route;
}

export async function resumeExecution(route: Route,) {
  if (!route.id) {
    throw new Error("Quote does not have an id. Please call executeRoute instead.",);
  }

  const executionData = executionState.get(route.id,);
  if (executionData) {
    return executionData.promise;
  }

  const restartedRoute = await restartRoute(route,);

  return executeRoute(restartedRoute,);
}

async function restartRoute(route: Route,): Promise<Route> {
  for (let index = 0; index < route.steps.length; index++) {
    const step = route.steps[index];
    const stepHasFailed = step.execution?.status === "FAILED";

    if (stepHasFailed) {
      if (step.execution) {
        step.execution.process = step.execution.process.filter(
          (process,) => process.status === "DONE",
        );
      }
    }
  }

  return route;
}
