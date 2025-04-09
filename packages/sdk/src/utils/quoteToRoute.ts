import type { UnexecutedRoute, } from "@sdk/types/sdk";
import type { ProviderQuoteOption, RouteType, } from "@sdk/types/server";

export function quoteToRoute(type: `${RouteType}`, quote: ProviderQuoteOption["paymentMethods"][0], provider: ProviderQuoteOption["provider"],): UnexecutedRoute {
  return {
    type,
    provider,
    ...quote,
  };
}
