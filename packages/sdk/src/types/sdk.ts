import type {
  LiFiStep, RouteExtended, SDKProvider,
} from "@lifi/sdk";
import type { ProviderQuoteOption, } from "@sdk/types/server";
import type { Address, } from "viem";

export type Services = "kado";

export type SDKConfig = {
  integrator: string;
  services: Services[];
  provider: SDKProvider | null;
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

export type fetchConfigParams = {
  tokenSort: "marketCap" | "usdPrice";
};

export type Substatus = {
  message: string;
  action: string;
};

export type ProcessType =
  | "EXTERNAL"
  | "STATUS_CHECK";

export type ProcessStatus =
  | "PENDING"
  | "ACTION_REQUIRED"
  | "PERMIT_REQUIRED"
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
  [key: string]: unknown
}

export interface StepExtended {
  id: string
  type: string
  execution?: Execution
  swapQuote?: LiFiStep
  lifiRoute?: RouteExtended
  [key: string]: unknown
}

export interface Route extends Omit<ProviderQuoteOption, "steps"> {
  id: string
  status: "HALTING" | "HALTED" | "RUNNING" | "DONE";
  steps: StepExtended[]
}
