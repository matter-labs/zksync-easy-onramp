import { useAsyncState, } from "@vueuse/core";
import { defineStore, } from "pinia";
import { ref, } from "vue";
import type { ProviderQuoteOption, } from "zksync-easy-onramp-sdk";
import { executeRoute, } from "zksync-easy-onramp-sdk";

export const useOrderProcessingStore = defineStore("order-processing", () => {
  const quote = ref<ProviderQuoteOption | null>(null,);
  const {
    state: results,
    isReady,
    isLoading: inProgress,
    error,
    execute,
  } = useAsyncState(
    async () => {
      if (!quote.value) {
        throw new Error("No order selected",);
      }
      console.log("ordering", quote.value,);
      await executeRoute(quote.value,);
    },
    null,
    { immediate: false, },
  );

  function selectQuote(route: ProviderQuoteOption,) {
    quote.value = route;
  }

  return {
    quote,
    execute,
    inProgress,
    isReady,
    error,
    results,
    selectQuote,
  };
},);
