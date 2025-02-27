import type { Route, StepExtended, } from "@sdk/types/sdk";
import type { ProviderQuoteOption, } from "@sdk/types/server";
import { cloneDeep, } from "lodash";
import { v4 as uuidv4, } from "uuid";

export type ExecutionOptions = {
  onUpdateHook?: (route: Route) => void;
  allowExecution?: boolean; // eventually be private
};

export interface ExecutionData {
  route: Route
  promise?: Promise<Route>
  executionOptions?: ExecutionOptions
}

export interface ExecutionState {
  state: Partial<Record<string, ExecutionData>>
  get(routeId: string): ExecutionData | undefined
  getExecutionOptions(routeId: string): Omit<ExecutionOptions, "onUpdateHook"> | undefined
  set(quote: ProviderQuoteOption | Route, executionOptions?: ExecutionOptions): ExecutionData
  update(routeId: string, params: Partial<ExecutionData>): void
  delete(routeId: string): void
}

export const executionState: ExecutionState = {
  state: {},
  get(routeId: string,) {
    return this.state[routeId] ? cloneDeep(this.state[routeId],) : undefined;
  },
  getExecutionOptions(routeId: string,) {
    return { allowExecution: this.state[routeId]?.executionOptions?.allowExecution, status: this.state[routeId]?.route.status, };
  },
  set(quote, executionOptions,) {
    const route = generateIds(quote,);
    this.state[route.id] = {
      route,
      executionOptions: {
        allowExecution: true,
        ...executionOptions,
      },
    };

    return cloneDeep(this.state[route.id]!,);
  },
  update(routeId, params,) {
    const updatedParams = cloneDeep(params,);
    if (this.state[routeId]) {
      this.state[routeId] = {
        ...this.state[routeId]!,
        ...updatedParams,
        route: {
          ...this.state[routeId]!.route,
          ...updatedParams.route ?? {},
        },
      };
      this.state[routeId]!.executionOptions?.onUpdateHook?.(cloneDeep(this.state[routeId]!.route as Route,),);
    }
  },
  delete(routeId,) {
    delete this.state[routeId];
  },
};

function generateIds(route: ProviderQuoteOption | Route,): Route {
  if (!route.id) {
    const id = uuidv4();
    route.id = id;
    route.steps.forEach((step,index,) => {
      (step as StepExtended).id = `${id}:${index}`;
    },);
  }
  return route as Route;
}
