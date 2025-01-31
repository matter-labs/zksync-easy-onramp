import type { QuoteParams, SDKConfig, } from "./types/sdk";
import type { Quotes, } from "./types/server";

export async function fetchQuotes(params: QuoteParams, config: SDKConfig,): Promise<Quotes> {
  const results = await fetch(`${import.meta.env.VITE_API_URL}/quotes?to=${params.toAddress}&chainId=${params.fromChain}&token=${params.toToken}&fiatAmount=${params.fiatAmount}${ config.dev ? "&dev=true" : ""}`,)
    .then((response,) => response.json(),)
    .then((data,) => {
      console.log("fetched data", data,);
      return data;
    },)
    .catch((error,) => {
      console.error("Error fetching quotes:", error,);
      throw error;
    },);

  return results;
}
