import type {
  LiFiStep, RouteExtended, SDKProvider,
} from "@lifi/sdk";
import type { PaymentMethod as PaymentMethodServer,ProviderQuoteOption, } from "@sdk/types/server";
import type { Address, } from "viem";

export type Services = "kado" | "transak";

export type SDKConfig = {
  integrator: string;
  apiUrl?: string;
  services: Services[];
  provider: SDKProvider | null;
  dev?: boolean;
};

export type SupportedFiatCurrencies = "USD";
export type QuoteProviderType = "cex" | "onramp";
export type PaymentMethod = `${PaymentMethodServer}`;

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

export interface Step {
  type: "onramp_via_link" | "lifi_token_swap"
  [key: string]: unknown
}

export interface StepExtended extends Step {
  id: string
  execution: Execution
  swapQuote?: LiFiStep
  lifiRoute?: RouteExtended
  [key: string]: unknown
}

export interface UnexecutedRoute extends Omit<ProviderQuoteOption, "paymentMethods"> {
  steps: Step[]
}

export interface Route extends UnexecutedRoute {
  id: string
  status: "HALTING" | "HALTED" | "RUNNING" | "DONE";
  steps: StepExtended[]
}
