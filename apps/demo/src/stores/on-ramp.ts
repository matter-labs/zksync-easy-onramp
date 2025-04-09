import { defineStore, } from "pinia";
import { ref, } from "vue";
import type { ConfigResponse, FetchQuoteParams, } from "zksync-easy-onramp";

import { useQuotesStore, } from "./quotes";

export type Steps = "buy" | "quotes" | "processing" | "transactions" | "transaction";

export const useOnRampStore = defineStore("on-ramp", () => {
  const selectedCurrency = ref("USD",);
  const step = ref<Steps>("buy",);
  const quotesStore = useQuotesStore();
  const toToken = ref<ConfigResponse["tokens"][0] | null>(null,);

  const setStep = function (newStep: Steps,) {
    step.value = newStep;
  };

  const fetchQuotes = function (params: FetchQuoteParams,) {
    setStep("quotes",);
    quotesStore.fetchQuotes(params,);
  };

  return {
    toToken,
    setStep,
    step,
    fetchQuotes,
    selectedCurrency,
  };
},);
