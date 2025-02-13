import type { Route, } from "@sdk/types/sdk";
import type { ProviderQuoteOption, } from "@sdk/types/server";
import { cloneDeep, } from "lodash";
import { v4 as uuidv4, } from "uuid";

export type ExecutionOptions = {
  onUpdateHook?: (route: Route) => void;
};

export interface ExecutionData {
  route: Route
  promise?: Promise<Route>
  executionOptions?: ExecutionOptions
}

export interface ExecutionState {
  state: Partial<Record<string, ExecutionData>>
  get(routeId: string): ExecutionData | undefined
  set(quote: ProviderQuoteOption, executionOptions?: ExecutionOptions): ExecutionData
  update(routeId: string, params: Partial<ExecutionData>): void
  delete(routeId: string): void
}

export const executionState: ExecutionState = {
  state: {},
  get(routeId: string,) {
    return this.state[routeId] ? cloneDeep(this.state[routeId],) : undefined;
  },
  set(quote, executionOptions,) {
    const route = generateIds(quote,);
    this.state[route.id] = {
      route,
      executionOptions,
    };

    return cloneDeep(this.state[route.id]!,);
  },
  update(routeId, params,) {
    const updatedParams = cloneDeep(params,);
    if (this.state[routeId]) {
      this.state[routeId] = {
        ...this.state[routeId]!,
        ...updatedParams,
        route: updatedParams.route ?? this.state[routeId]!.route,
      };
      this.state[routeId]!.executionOptions?.onUpdateHook?.(cloneDeep(this.state[routeId]!.route,),);
    }
  },
  delete(routeId,) {
    delete this.state[routeId];
  },
};

function generateIds(route: ProviderQuoteOption,): Route {
  if (!route.id) {
    const id = uuidv4();
    route.id = id;
    route.steps.forEach((step,index,) => {
      step.id = `${id}:${index}`;
    },);
  }
  return route as Route;
}
