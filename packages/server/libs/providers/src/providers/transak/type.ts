import type { Address, } from "viem";

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