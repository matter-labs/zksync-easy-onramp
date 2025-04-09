import type { ProviderQuoteOption, } from "@sdk/types/server";
/**
 * Sorts a list of provider quotes by the highest return value in fiat currency among
 * all the providers.
 *
 * This function takes an array of `ProviderQuoteOption` objects, where each provider
 * may have multiple payment methods. It flattens the array by creating a new object
 * for each payment method, retaining the provider's other properties. The resulting
 * array is then sorted in ascending order based on the `amountFiat` value of the
 * first payment method in each provider's payment methods array.
 *
 * @param providerQuotes - An array of `ProviderQuoteOption` objects, each containing
 *                         a list of payment methods with associated fiat return values.
 * @returns A new array of `ProviderQuoteOption` objects, each containing a single
 *          payment method, sorted by the highest fiat return value.
 */
export function sortByHighestReturn(providerQuotes: ProviderQuoteOption[],): ProviderQuoteOption[] {
  const flatMapped = providerQuotes
    .flatMap((provider,) =>
      provider.paymentMethods.map((paymentMethod,) => ({
        ...provider,
        paymentMethods: [paymentMethod,],
      }),),
    );

  return flatMapped
    .sort((a, b,) => {
      console.log(a.paymentMethods[0].receive.amountFiat, b.paymentMethods[0].receive.amountFiat,);
      return a.paymentMethods[0].receive.amountFiat - b.paymentMethods[0].receive.amountFiat;
    },);
}
