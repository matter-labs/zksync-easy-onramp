import { useAsyncState, } from "@vueuse/core";
import { defineStore, } from "pinia";
import { ref, } from "vue";
import type { ProviderQuoteOption, Route, } from "zksync-easy-onramp-sdk";
import { executeRoute, resumeExecution, } from "zksync-easy-onramp-sdk";

import { useRoutesStore, } from "./routes";

export const useOrderProcessingStore = defineStore("order-processing", () => {
  const { updateRoute, removeRoute, } = useRoutesStore();
  const order = ref<Route | null>(null,);

  const onUpdateHook = (executingRoute: Route,) => {
    console.log("executing Route", JSON.parse(JSON.stringify(executingRoute,),),);
    updateRoute(executingRoute,);
    order.value = executingRoute;
  };

  const {
    state: results,
    // isReady,
    isLoading: inProgress,
    error,
    execute,
  } = useAsyncState(
    async () => {
      if (!order.value) {
        throw new Error("No order selected",);
      }
      console.log("ordering", order.value,);
      if (order.value.id) {
        console.log("RESUMING", order.value.id,);
        return await resumeExecution(order.value, { onUpdateHook, },);
      } else {
        console.log("EXECUTING", order.value,);
        return await executeRoute(order.value, { onUpdateHook, },);
      }

    },
    null,
    {
      immediate: false,
      onSuccess: (completedRoute: Route,) => {
        updateRoute(completedRoute,);
        removeRoute(completedRoute.id,);
      },
      onError: (error,) => {
        console.error("error", error,);
      },
    },
  );

  function selectQuote(route: ProviderQuoteOption | Route,) {
    order.value = route as Route;
  }

  return {
    order,
    execute,
    inProgress,
    error,
    results,
    selectQuote,
  };
},);
