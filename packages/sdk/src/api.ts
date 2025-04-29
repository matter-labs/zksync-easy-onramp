import { config, } from "@sdk/config";
import type { FetchQuoteParams, } from "@sdk/types/sdk";
import type { ConfigResponse, QuotesResponse, } from "@sdk/types/server";

export async function fetchQuotes(params: FetchQuoteParams,): Promise<QuotesResponse> {
  const apiUrl = config.get().apiUrl;
  const url = new URL(`${apiUrl}/quotes`,);
  const urlParams = new URLSearchParams();
  urlParams.append("to", params.toAddress as string,);
  urlParams.append("chainId", params.chainId.toString(),);
  urlParams.append("token", params.toToken,);
  urlParams.append("routeType", "buy",);

  const services = config.get().services;
  if (services.length > 0) {
    urlParams.append("services", services.join(",",),);
  }
  if (params.fiatCurrency) {
    urlParams.append("fiatCurrency", params.fiatCurrency,);
  }
  if (params.fiatAmount) {
    urlParams.append("fiatAmount", params.fiatAmount.toString(),);
  }
  if (config.get().dev) {
    urlParams.append("dev", "true",);
  }

  const results = await fetch(`${url}?${urlParams.toString()}`,)
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
