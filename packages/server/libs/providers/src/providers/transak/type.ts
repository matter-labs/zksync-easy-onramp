import type { Address, } from "viem";

export type TransakEnvironment = "production" | "staging";

export type TransakCountriesResponse = {
  alpha2: string;
  name: string;
  isAllowed: boolean;
  isLightKycAllowed: boolean;
  currencyCode: string;
  supportedDocuments: string[];
}[];

export type TransakCryptoCurrenciesResponse = {
  _id: string;
  coinId: string;
  symbol: string;
  name: string;
  address: Address;
  isAllowed: boolean;
  network: {
    name: string;
    chainId: string;
  }
}[];

export type TransakQuoteResponse = {
  quoteId: string;
  conversionPrice: number;
  marketConversionPrice: number;
  slippage: number;
  fiatCurrency: string;
  cryptoCurrency: string;
  paymentMethod: string;
  fiatAmount: number;
  cryptoAmount: number;
  isBuyOrSell: "BUY" | "SELL";
  network: string;
  feeDecimal: number;
  totalFee: number;
  cryptoLiquidityProvider: string;
  notes: string[];
};

export interface TransakApiResponse <T,> {
  response: T;
}

type OnrampOrderStatusCode =
 | "AWAITING_PAYMENT_FROM_USER"             // When the order is created but the payment still not received
 | "PAYMENT_DONE_MARKED_BY_USER"            // When the user marks the payment as done but it is received by us yet
 | "PROCESSING"                             // Orders in the PROCESSING state have passed the checks and the user's payment information has been validated
 | "PENDING_DELIVERY_FROM_TRANSAK"          // When the payment is received and being exchanged & transferred via us or our liquidity partner
 | "ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK"  // Order is on hold
 | "COMPLETED"                              // When we have received the payment and the crypto is sent successfully to the user
 | "CANCELLED"                              // Order is cancelled
 | "FAILED"                                 // When the order is failed, e.g.: because of the card decline
 | "REFUNDED"                               // Order is refunded to the user
 | "EXPIRED";                               // When the user failed to make the payment within the timeframe.

export type TransakApiOrderStatusResponse = {
  data: {
    status: OnrampOrderStatusCode;
    statusHistories: {
      status: OnrampOrderStatusCode;
      createdAt: string;
      message: string;
    }[];
    fiatCurrency: string;
    cryptoCurrency: string;
    isBuyOrSell: "BUY" | "SELL";
    fiatAmount: number;
    amountPaid: number;
    cryptoAmount: number;
    conversionPrice: number;
    totalFeeInFiat: number;
    network: string;
    autoExpiresAt: string;
    createdAt: string;
    completedAt?: string;
  }
};

/* Our API */
export class OrderStatusResponse {
  status: OnrampOrderStatusCode;
  statusMessage?: string;
  fiatCurrency: string;
  cryptoCurrency: string;
  isBuyOrSell: "BUY" | "SELL";
  fiatAmount: number;
  amountPaid: number;
  cryptoAmount: number;
  conversionPrice: number;
  totalFeeInFiat: number;
  network: string;
  autoExpiresAt: string;
  createdAt: string;
  completedAt?: string;
};
