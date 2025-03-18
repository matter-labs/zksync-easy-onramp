import { config, } from "@sdk/config";
import type { FetchQuoteParams, } from "@sdk/types/sdk";
import type { ConfigResponse, QuotesResponse, } from "@sdk/types/server";

export async function fetchQuotes(params: FetchQuoteParams,): Promise<QuotesResponse> {
  const apiUrl = config.get().apiUrl;
  const url = new URL(`${apiUrl}/quotes`,);
  url.searchParams.append("to", params.toAddress as string,);
  url.searchParams.append("chainId", params.chainId.toString(),);
  url.searchParams.append("token", params.toToken,);
  url.searchParams.append("routeType", "buy",);
  if (params.fiatCurrency) {
    url.searchParams.append("fiatCurrency", params.fiatCurrency,);
  }
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

export async function fetchConfig(): Promise<ConfigResponse> {
  const apiUrl = config.get().apiUrl;
  const url = new URL(`${apiUrl}/config`,);

  const results = await fetch(url,)
    .then((response,) => response.json(),)
    .then((data,) => {
      return data;
    },)
    .catch((error,) => {
      throw error;
    },);

  return results;
}
