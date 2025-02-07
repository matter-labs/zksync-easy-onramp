import type { ProviderQuoteOption, QuoteStep, } from "@sdk/types/server";
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

export type ExecutionStatus = "ACTION_REQUIRED" | "PENDING" | "FAILED" | "DONE";

export interface Execution {
  status: ExecutionStatus
  message?: string
}

export interface StepExtended extends QuoteStep {
  execution?: Execution
}

export interface Route extends Omit<ProviderQuoteOption, "steps"> {
  steps: StepExtended[]
}
