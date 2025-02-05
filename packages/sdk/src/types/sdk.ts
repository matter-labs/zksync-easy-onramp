import type { Address, } from "viem";

export type Services = "kado";

export type SDKConfig = {
  integrator: string;
  services: Services[];
  dev?: boolean;
};

export type QuoteParams = {
  fiatAmount: number;
  fromChain: number;
  fromCurrency: string;
  toToken: Address;
  fromAddress?: Address;
  toAddress?: Address;
};
