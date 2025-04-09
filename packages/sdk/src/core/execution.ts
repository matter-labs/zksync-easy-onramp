import { stopRouteExecution as stopLifiRouteExecution,updateRouteExecution as updateLifiRouteExecution, } from "@lifi/sdk";
import type { ExecutionData, ExternalExecutionOptions, } from "@sdk/core/executionState";
import { executionState, } from "@sdk/core/executionState";
import type { Route, UnexecutedRoute, } from "@sdk/types/sdk";

import { getExecutor, } from "./executors/ExecutorFactory";

export async function executeRoute(quote: UnexecutedRoute | Route, executionOptions?: ExternalExecutionOptions,): Promise<Route> {
  if (quote.id) {
    const executionData = executionState.get(quote.id,);
    if (!!executionData?.promise) {
      return executionData.promise;
    }
  }

  const executionData = executionState.set({ ...(quote as UnexecutedRoute), status: "RUNNING", }, executionOptions,);
  const executionPromise = executeSteps(executionData,);
  executionState.update(executionData.route.id,{ promise: executionPromise, },);

  return executionPromise;
}

export function updateRouteExecution(route: Route, executionOptions: ExternalExecutionOptions,) {
  const executionData = executionState.get(route.id,);
  if (!executionData) {
    return;
  }

  if ("executeInBackground" in executionOptions) {
    executionState.update(route.id, { executionOptions, },);
    const lifiStep = executionData.route.steps.find((step,) => step.type.includes("lifi",),);
    if (lifiStep && lifiStep.lifiRoute) {
      updateLifiRouteExecution(lifiStep!.lifiRoute!, { executeInBackground: executionOptions.executeInBackground, },);
    }
  }
}

export function stopRouteExecution(routeId: Route["id"],): void {
  const executionData = executionState.get(routeId,);
  if (!executionData) {
    return;
  }

  const updatedRoute = executionState.update(routeId,{
    route: { ...executionData.route, status: "HALTING", },
    executionOptions: { allowExecution: false, },
  },
  );

  const lifiStep = executionData.route.steps.find((step,) => step.type.includes("lifi",),);
  if (lifiStep && lifiStep.lifiRoute) {
    stopLifiRouteExecution(lifiStep!.lifiRoute!,);
  }

  console.log("[execution] stopping route", JSON.parse(JSON.stringify(updatedRoute,),),);
}

export async function resumeRouteExecution(route: Route, executionOptions?: ExternalExecutionOptions,): Promise<Route> {
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
    // use to build a step to skip over or test with
    // const step = uglyTest(executionData.route.steps[i], executionData.route.id,);
    const step = executionData.route.steps[i];

    if (step.execution?.status === "DONE") {
      continue;
    }
    const executor = getExecutor(executionData.route, executionData.route.steps[i],);
    try {
      await executor.executeStep();

      const _executionData = executionState.get(executionData.route.id,);
      if (_executionData && !_executionData.executionOptions?.allowExecution) {
        const route = executionState.update(_executionData.route.id, { route: { ..._executionData.route, status: "HALTED", }, },);
        executionState.delete(route!.id,);
        return route!;
      }
    } catch (e:any) {
      const _executionData = executionState.get(executionData.route.id,);
      executionState.update(_executionData!.route.id, { route: { ..._executionData!.route, status: "HALTED", }, },);
      executionState.delete(_executionData!.route.id,);
      throw new Error("ERROR in SDK", e,);
    }
  }

  console.log("[sdk] all steps done",);
  const _executionData = executionState.get(executionData.route.id,);
  const allStepsDone = _executionData!.route.steps.every((step,) => step.execution?.status === "DONE",);
  let updatedRoute;
  if (!allStepsDone) {
    updatedRoute = executionState.update(_executionData!.route.id, { route: { ..._executionData!.route, status: "HALTED", }, },);
  } else {
    updatedRoute = executionState.update(_executionData!.route.id, { route: { ..._executionData!.route, status: "DONE", }, },);
  }
  executionState.delete(updatedRoute!.id,);
  return updatedRoute!;
}

// function uglyTest(step: StepExtended, routeId: string,) {
//   if (step.type === "onramp_via_link") {
//     step = {
//       ...step,
//       execution: {
//         status: "DONE",
//         process: [
//           {
//             status: "DONE",
//             type: "EXTERNAL",
//             message: "Checkout via link completed.",
//           },
//           {
//             status: "DONE",
//             type: "STATUS_CHECK",
//             message: "Order status completed.",
//           },
//         ],
//       },
//     };
//     const _executionData = executionState.get(routeId,);
//     _executionData!.route.steps[0] = step;
//     executionState.update(routeId, { route: { ..._executionData!.route, status: "RUNNING", }, },);

//   }

//   return step;
// }
