import type { PaymentMethod, } from "@sdk/types/sdk";
import type { ProviderQuoteOption, } from "@sdk/types/server";

/**
 * Filters provider quotes based on payment method types.
 * Can either include only specified payment methods or exclude specified payment methods.
 * Removes any provider quotes that end up with no payment methods after filtering.
 *
 * @param providerQuotes - The array of provider quotes to filter
 * @param paymentMethods - The array of payment method types to include or exclude
 * @param filterType - Determines whether to include or exclude the specified payment methods (default: "include")
 * @returns A new array of filtered provider quotes
 */
export function filterByPaymentMethod(
  providerQuotes: ProviderQuoteOption[],
  paymentMethods: PaymentMethod[],
  filterType: "include" | "exclude" = "include",
): ProviderQuoteOption[] {
  // If no payment methods specified, return all provider quotes unchanged
  if (!paymentMethods.length) {
    return [...providerQuotes,];
  }

  // Filter payment methods for each provider quote
  const filteredQuotes = providerQuotes.map((providerQuote,) => ({
    ...providerQuote,
    paymentMethods: providerQuote.paymentMethods.filter((paymentMethod,) => {
      const isIncluded = paymentMethods.includes(paymentMethod.method,);
      // If filterType is "include", keep methods that are in the paymentMethods array
      // If filterType is "exclude", keep methods that are NOT in the paymentMethods array
      return filterType === "include" ? isIncluded : !isIncluded;
    },),
  }),);

  // Remove provider quotes with empty payment methods arrays
  return filteredQuotes.filter((providerQuote,) => providerQuote.paymentMethods.length > 0,);
}
