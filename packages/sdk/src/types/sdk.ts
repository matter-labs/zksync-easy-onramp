import type { ProviderQuoteOption, } from "@sdk/types/server";
import type { Address, } from "viem";

export type Services = "kado";

export type SDKConfig = {
  integrator: string;
  services: Services[];
  dev?: boolean;
};

export type SupportedFiatCurrencies = "USD";
export type QuoteProviderType = "cex" | "onramp";
export type PaymentMethod = "credit_card" | "apple_pay_credit" | "google_pay_credit" | "debit_card" | "apple_pay_debit" | "google_pay_debit" | "wire" | "pix" | "sepa" | "ach" | "koywe";

export type FetchQuoteParams = {
  toAddress: Address;
  fiatAmount?: number;
  fiatCurrency?: SupportedFiatCurrencies;
  chainId: number;
  toToken: Address;
  tokenAmount?: number;
  providerTypes?: QuoteProviderType[];
  paymentMethods?: PaymentMethod[];
  routeType?: "buy" | "sell";
  country?: string;
};

export type Substatus = {
  message: string;
  action: string;
};

export type ProcessType =
  | "EXTERNAL"
  | "STATUS_CHECK";

export type ProcessStatus =
  | "STARTED"
  | "PENDING"
  | "ACTION_REQUIRED"
  | "DONE"
  | "FAILED"
  | "CANCELLED";

export type Process = {
  type: ProcessType,
  message: string
  status: ProcessStatus
  substatus?: Substatus
  [key: string]: any
};

export type ExecutionStatus = "ACTION_REQUIRED" | "PENDING" | "FAILED" | "DONE";

export interface Execution {
  status: ExecutionStatus
  message?: string
  process: Process[]
}

export interface StepExtended {
  id: string
  type: string
  execution?: Execution
  [key: string]: unknown
}

export interface Route extends Omit<ProviderQuoteOption, "steps"> {
  id: string
  steps: StepExtended[]
}
