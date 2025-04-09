import type { ProviderQuoteOption, } from "@sdk/types/server";

/**
 * Sorts an array of provider quotes by arranging the payment methods of each provider
 * in descending order based on the `amountFiat` value in the `receive` property.
 *
 * @param providerQuotes - An array of provider quote options to be sorted.
 * @returns A new array of provider quote options with their payment methods sorted
 *          by the `amountFiat` value in descending order.
 */
export function sortProviderQuotes(
  providerQuotes: ProviderQuoteOption[],
): ProviderQuoteOption[] {
  return providerQuotes.map((provider,) => ({
    ...provider,
    paymentMethods: provider.paymentMethods.sort(
      (a, b,) => a.receive.amountFiat - b.receive.amountFiat,
    ),
  }),);
}
