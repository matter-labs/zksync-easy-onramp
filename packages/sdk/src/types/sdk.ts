import type { ProviderQuoteOption, QuoteStep, } from "@sdk/types/server";
import type { Address, } from "viem";

export type Services = "kado";

export type SDKConfig = {
  integrator: string;
  services: Services[];
  dev?: boolean;
};

export type RequestQuoteParams = {
  fiatAmount: number;
  fromChain: number;
  fromCurrency: string;
  toToken: Address;
  fromAddress?: Address;
  toAddress?: Address;
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

export interface StepExtended extends QuoteStep {
  id: string
  execution?: Execution
}

export interface Route extends Omit<ProviderQuoteOption, "steps"> {
  id: string
  steps: StepExtended[]
}
