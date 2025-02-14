import { defineStore, } from "pinia";
import { ref, } from "vue";
import type { RequestQuoteParams, } from "zksync-easy-onramp-sdk";

import { useQuotesStore, } from "./quotes";

export type Steps = "buy" | "quotes" | "processing";

export const useOnRampStore = defineStore("on-ramp", () => {
  const step = ref<Steps>("buy",);
  const quotesStore = useQuotesStore();

  const setStep = function(newStep: Steps,) {
    step.value = newStep;
  };

  const fetchQuotes = function(params: RequestQuoteParams,) {
    setStep("quotes",);
    quotesStore.fetchQuotes(params,);
  };

  return {
    setStep, step, fetchQuotes,
  };
},);
