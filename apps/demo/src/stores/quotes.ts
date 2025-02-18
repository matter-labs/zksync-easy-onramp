import { defineStore, } from "pinia";
import { ref, } from "vue";
import type { ProviderQuoteOption, FetchQuoteParams } from "zksync-easy-onramp-sdk";
import { fetchQuotes as fetchSDKQuotes } from "zksync-easy-onramp-sdk";

export const useQuotesStore = defineStore("quotes", () => {
  const inProgress = ref(false,);
  const error = ref<Error | null>(null,);
  const quotes = ref<ProviderQuoteOption[]>([],);

  async function fetchQuotes(params: FetchQuoteParams,) {
    inProgress.value = true;
    try {
      const response = await fetchSDKQuotes(params,);
      console.log('fetched data', response.quotes,);
      quotes.value = response.quotes;
      error.value = null;
    } catch (err: unknown) {
      console.error(err,);
      if (err instanceof Error) {
        error.value = err;
      } else {
        error.value = new Error(String(err,),);
      }
      quotes.value = [];
    } finally {
      inProgress.value = false;
    }
  }

  return {
    inProgress,
    fetchQuotes,
    error,
    quotes,
  };
},);
