import { useAsyncState, } from "@vueuse/core";
import { defineStore, } from "pinia";
import { fetchConfig,  } from "zksync-easy-onramp";

export const useOnRampConfigStore = defineStore("on-ramp-config", () => {
  const {
    state: config, isReady, isLoading: inProgress, error,
  } = useAsyncState(
    fetchConfig(),
    {
      chains: [],
      providers: [],
      tokens: [],
    },
  );

  return {
    config, isReady, inProgress, error,
  };
},);
