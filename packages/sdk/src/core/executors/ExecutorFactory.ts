import type { Route, } from "@sdk/types/sdk";

import { KadoStepExecutor, } from "./KadoStepExecutor";
import { LifiStepExecutor, } from "./LifiStepExecutor";
import { TransakStepExecutor, } from "./TransakStepExecutor";

export function getExecutor(route: Route, step: Route["steps"][number],) {
  if (step.type === "onramp_via_link") {
    switch (route.provider.key) {
      case "kado":
        return new KadoStepExecutor(route, step,);
      case "transak":
        return new TransakStepExecutor(route, step,);
    }
  } else if (step.type === "lifi_token_swap") {
    return new LifiStepExecutor(route, step,);
  }
  throw new Error(`No executor found for provider ${route.provider.key}`,);
}
