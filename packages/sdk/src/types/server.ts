import type { LiFiStep, } from "@lifi/sdk";
import type { Address, } from "viem";

export const supportedFiatCurrencies = ["USD",] as const;
export type FiatCurrency = typeof supportedFiatCurrencies[number];

export type Provider = {
  key: string;
  type: QuoteProviderType;
  name: string;
  iconUrl: string;
};

export enum RouteType {
  BUY = "buy",
  SELL = "sell",
}

export enum QuoteProviderType {
  CEX = "cex",
  ONRAMP = "onramp",
}

export enum PaymentMethod {
  APPLE_PAY_CREDIT = "apple_pay_credit",
  GOOGLE_PAY_CREDIT = "google_pay_credit",
  APPLE_PAY_DEBIT = "apple_pay_debit",
  GOOGLE_PAY_DEBIT = "google_pay_debit",
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  WIRE = "wire",
  PIX = "pix",
  SEPA = "sepa",
  ACH = "ach",
  KOYWE = "koywe",
}

export enum KycRequirement {
  NO_KYC = "no_kyc",
  BASIC = "basic",
  DOCUMENT_BASED = "document_based",
}

export type Token = {
  chainId: number;
  address: Address;
  decimals: number;
  symbol: string;
  name: string;
  usdPrice: number;
  marketCap: number;
  iconUrl?: string;
};

export type QuoteOptions = {
  to: Address;
  chainId: number;
  token: Address;
  amount?: string;
  fiatAmount?: string;
  fiatCurrency: FiatCurrency;
  providerTypes: QuoteProviderType[];
  paymentMethods: PaymentMethod[];
  routeType: RouteType;
  country?: string;
  dev?: boolean;
};

export type QuoteStepOnrampViaLink = {
  id?: string;
  type: "onramp_via_link";
  link: string;
};

export type QuoteStepTokenSwap = {
  type: "lifi_token_swap";
  swapQuote: LiFiStep;
};

export type QuoteStep = QuoteStepOnrampViaLink | QuoteStepTokenSwap;

export interface PaymentMethodQuote {
  method: PaymentMethod;
  pay: {
    currency: string;
    fiatAmount: number;
    totalFeeFiat: number;
    minAmountUnits?: string;
    minAmountFiat?: number;
    maxAmountUnits?: string;
    maxAmountFiat?: number;
  };
  receive: {
    token: Token;
    chain: {
      id: number;
      name: string;
    };
    to: Address;
    amountUnits: string;
    amountFiat: number;
  };
  kyc: KycRequirement[];
  steps: QuoteStep[];
}
export interface ProviderQuoteOption {
  id?: string;
  type: RouteType;
  provider: Provider;
  country?: string;
  paymentMethods: PaymentMethodQuote[];
};

export type QuotesResponse = {
  quotes: ProviderQuoteOption[];
};

export type ConfigResponse = {
  chains: Array<{
    id: number;
    name: string;
  }>;
  fiatCurrencies: Array<FiatCurrency>;
  providers: Array<Provider & { tokens: Array<{ type: RouteType; token: Token; }> }>;
  tokens: Array<Token>;
};
