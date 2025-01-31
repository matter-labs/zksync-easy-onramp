import type { QuoteParams, SDKConfig, } from "@sdk/types/sdk";

import { fetchQuotes, } from "./api";
import { config, } from "./config";

export type { QuoteParams, SDKConfig, } from "@sdk/types/sdk";

export const zksyncEasyOnRamp = (() => {
  const _config: SDKConfig = config;
  let initialized = false;

  return {
    init: (config: SDKConfig,) => {
      Object.assign(_config, config,);
      initialized = true;
      console.log("zksyncEasyOnRamp initialized", _config,);
    },
    fetchQuotes: async (params: QuoteParams,) => {
      if (!initialized) {
        throw new Error("zksyncEasyOnRamp not initialized",);
      }
      console.log("fetchQuotes", params,);
      return await fetchQuotes(params, _config,);
    },
  };
})();
