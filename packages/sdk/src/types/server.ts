import type { Address, } from "viem";

export const supportedFiatCurrencies = ["USD",];
export type FiatCurrency = typeof supportedFiatCurrencies[number];

export enum RouteType {
  BUY = "buy",
  SELL = "sell",
}

export enum QuoteProviderType {
  CEX = "cex",
  ONRAMP = "onramp",
}

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  APPLE_PAY_CREDIT = "apple_pay_credit",
  GOOGLE_PAY_CREDIT = "google_pay_credit",
  DEBIT_CARD = "debit_card",
  APPLE_PAY_DEBIT = "apple_pay_debit",
  GOOGLE_PAY_DEBIT = "google_pay_debit",
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
  type: "onramp_via_link";
  link: string;
};

export type QuoteStep = QuoteStepOnrampViaLink;

export interface ProviderQuoteOption {
  type: RouteType;
  provider: {
    key: string;
    type: QuoteProviderType;
    name: string;
    iconUrl: string;
  };
  pay: {
    currency: string;
    fiatAmount: number;
    totalFeeUsd: number;
    minAmountUnits?: string;
    minAmountUsd?: number;
    maxAmountUnits?: string;
    maxAmountUsd?: number;
  };
  receive: {
    token: {
      address: string;
      symbol: string;
      name: string;
      decimals: number;
    };
    chain: {
      id: number;
      name: string;
    };
    to: Address;
    amountUnits: string;
    amountUsd: number;
  };
  paymentMethods: PaymentMethod[];
  kyc: KycRequirement[];
  steps: QuoteStep[];
  country?: string;
};

export type QuotesResponse = {
  quotes: ProviderQuoteOption[];
};
