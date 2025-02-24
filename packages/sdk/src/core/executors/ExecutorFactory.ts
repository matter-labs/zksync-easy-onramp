import type { Route, } from "@sdk/types/sdk";

import { KadoStepExecutor, } from "./KadoStepExecutor";
import { LifiStepExecutor, } from "./LifiStepExecutor";

export function getExecutor(route: Route, step: Route["steps"][number],) {
  if (route.provider.key === "kado" && step.type === "onramp_via_link") {
    return new KadoStepExecutor(route, step,);
  }
  if (step.type.includes("lifi",)) {
    return new LifiStepExecutor(route, step,);
  }
  throw new Error(`No executor found for provider ${route.provider.key}`,);
}
