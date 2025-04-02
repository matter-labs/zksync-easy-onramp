import type { PaymentMethodQuoteDto, } from "./quotes.dto";

export const findBestQuote = (quotesByPaymentMethod: PaymentMethodQuoteDto[],): PaymentMethodQuoteDto => {
  return quotesByPaymentMethod.reduce((bestQuote, quote,) => {
    if (quote.receive.amountFiat > bestQuote.receive.amountFiat) {
      return quote;
    }
    return bestQuote;
  }, quotesByPaymentMethod[0],);
};