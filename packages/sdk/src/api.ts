import { config, } from "@sdk/config";
import type { FetchQuoteParams, } from "@sdk/types/sdk";
import type { QuotesResponse, } from "@sdk/types/server";

export async function fetchQuotes(params: FetchQuoteParams,): Promise<QuotesResponse> {
  const url = new URL(`${import.meta.env.VITE_API_URL}/quotes`,);
  url.searchParams.append("to", params.toAddress as string,);
  url.searchParams.append("chainId", params.chainId.toString(),);
  url.searchParams.append("token", params.toToken,);
  url.searchParams.append("fiatCurrency", params.fiatCurrency,);
  url.searchParams.append("routeType", "buy",);
  if (params.fiatAmount) {
    url.searchParams.append("fiatAmount", params.fiatAmount.toString(),);
  }
  if (config.get().dev) {
    url.searchParams.append("dev", "true",);
  }

  const results = await fetch(url,)
    .then((response,) => response.json(),)
    .then((data,) => {
      return data;
    },)
    .catch((error,) => {
      throw error;
    },);

  return results as QuotesResponse;
}
