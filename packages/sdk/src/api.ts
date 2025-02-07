import type { QuoteParams, SDKConfig, } from "./types/sdk";
import type { QuotesResponse, } from "./types/server";

export async function fetchQuotes(params: QuoteParams, config: SDKConfig,): Promise<QuotesResponse> {
  const url = new URL(`${import.meta.env.VITE_API_URL}/quotes`,);
  url.searchParams.append("to", params.toAddress as string,);
  url.searchParams.append("chainId", params.fromChain.toString(),);
  url.searchParams.append("token", params.toToken,);
  url.searchParams.append("fiatAmount", params.fiatAmount.toString(),);
  if (config.dev) {
    url.searchParams.append("dev", "true",);
  }

  const results = await fetch(url,)
    .then((response,) => response.json(),)
    .then((data,) => {
      console.log("fetched data", data,);
      return data;
    },)
    .catch((error,) => {
      console.error("Error fetching quotes:", error,);
      throw error;
    },);

  return results as QuotesResponse;
}
