import type { Route, } from "@sdk/types/sdk";

import { KadoStepExecutor, } from "./KadoStepExecutor";

export function getExecutor(route: Route, step: Route["steps"][number],) {
  if (route.provider.key === "kado") {
    return new KadoStepExecutor(route, step,);
  }
  throw new Error(`No executor found for provider ${route.provider.key}`,);
}
