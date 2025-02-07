import { fetchQuotes, } from "@sdk/api";
import { config, } from "@sdk/config";
import type { QuoteParams, SDKConfig, } from "@sdk/types/sdk";
export { executeQuote, } from "@sdk/execution";
export { ExecutionState, } from "@sdk/execution/state";
export type {
  QuoteParams, Route,SDKConfig, 
} from "@sdk/types/sdk";
export type {
  PaymentMethod,ProviderQuoteOption, QuotesResponse,
} from "@sdk/types/server";

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
