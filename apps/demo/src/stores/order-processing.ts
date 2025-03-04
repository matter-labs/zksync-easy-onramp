import { useAsyncState } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { ProviderQuoteOption, Route } from "zksync-easy-onramp";
import {
  executeRoute,
  resumeRouteExecution,
  stopRouteExecution,
} from "zksync-easy-onramp";

import { useRoutesStore } from "./routes";

export const useOrderProcessingStore = defineStore("order-processing", () => {
  const { updateRoute, removeRoute } = useRoutesStore();
  const order = ref<Route | null>(null);

  const orderStatus = computed(() => {
    switch (order.value?.status) {
      case "RUNNING":
      case "HALTING":
        return "IN_PROGRESS";
      case "HALTED":
        return "STOPPED";
      case "DONE":
        return "DONE";
      default:
        return "PENDING";
    }
  });

  const onUpdateHook = (executingRoute: Route) => {
    console.log(
      "[app] updating route: ",
      JSON.parse(JSON.stringify(executingRoute)),
    );
    updateRoute(executingRoute);
    order.value = executingRoute;
  };

  const {
    state: results,
    isReady,
    isLoading: inProgress,
    error,
    execute,
  } = useAsyncState(
    async () => {
      if (!order.value) {
        throw new Error("No order selected");
      }

      if (order.value.id) {
        console.log("[app] RESUMING", order.value.id);
        const result = await resumeRouteExecution(order.value, {
          onUpdateHook,
        });
        return result;
      } else {
        console.log("[app] EXECUTING", order.value);
        const result = await executeRoute(order.value, { onUpdateHook });
        return result;
      }
    },
    {} as Route,
    {
      immediate: false,
      onSuccess: (completedRoute: Route) => {
        console.log("[app] resolved");
        updateRoute(completedRoute);
        if (completedRoute.status === "DONE") {
          removeRoute(completedRoute.id);
        }
      },
      onError: (errorData: unknown) => {
        console.error("[app] error", errorData);
      },
    },
  );

  function selectQuote(route: ProviderQuoteOption | Route) {
    order.value = route as Route;
  }

  function stopRoute() {
    console.log("[app] stopping route");
    if (order.value) {
      stopRouteExecution(order.value.id);
    }
  }

  return {
    order,
    orderStatus,
    execute,
    inProgress,
    isReady,
    error,
    results,
    selectQuote,
    stopRoute,
  };
});
