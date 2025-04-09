import type { ProviderQuoteOption, } from "@sdk/types/server";

/**
 * Sorts provider quotes by fee amount either within each provider or across all providers.
 *
 * @param providerQuotes - An array of provider quote options to be sorted
 * @param group - Whether to maintain the grouping of payment methods by provider (true) or
 *                flatten and sort across all providers (false)
 * @param order - Sort order: 'asc' for ascending (lower fees first) or 'desc' for descending (higher fees first)
 * @returns A new array of provider quote options with payment methods sorted by fees
 */
export function sortByFees(
  providerQuotes: ProviderQuoteOption[],
  group: boolean = true,
  order: "asc" | "desc" = "asc",
): ProviderQuoteOption[] {
  const sortFn = (a: ProviderQuoteOption["paymentMethods"][0], b: ProviderQuoteOption["paymentMethods"][0],) => {
    const multiplier = order === "asc" ? 1 : -1;
    return (a.pay.totalFeeFiat - b.pay.totalFeeFiat) * multiplier;
  };

  if (group) {
    // Sort payment methods within each provider
    return providerQuotes.map((provider,) => ({
      ...provider,
      paymentMethods: [...provider.paymentMethods,].sort(sortFn,),
    }),);
  } else {
    // Flatten all payment methods, sort them, and return the flattened array
    return providerQuotes.flatMap((provider,) =>
      provider.paymentMethods.map((method,) => ({
        ...provider,
        paymentMethods: [method,],
      }),),
    ).sort((a,b,) => sortFn(a.paymentMethods[0], b.paymentMethods[0],),);
  }
}
