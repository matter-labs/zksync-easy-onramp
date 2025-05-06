import type {
  LiFiStep, RouteExtended, SDKProvider,
} from "@lifi/sdk";
import type {
  PaymentMethod as PaymentMethodServer,PaymentMethodQuote, ProviderQuoteOption,
} from "@sdk/types/server";
import type { Address, } from "viem";

export type Services = "transak";

export type SDKConfig = {
  /**
   * A plain string that identifies the integrator.
   */
  integrator: string;
  /**
   * The URL for the API endpoint that the on-ramp SDK
   * will use to request quotes and SDK config settings.
   *
   * By default it will use the production URL,
   * but you can set it to a custom URL for testing purposes.
   *
   * If you want to use the development mode which uses
   * sandbox URLs from services to generate quotes,
   * you can set the `dev` flag to `true`.
   */
  apiUrl?: string;
  /**
   * The list of services to be used for the onramp.
   *
   * If no services are defined,
   * or if none of the keys are valid in the array,
   * all services will be provided for quotes.
  */
  services: Services[];
  /**
   * The provider configuration to handle wallet
   * transactions and chain switching via the on-ramp.
   */
  provider: SDKProvider | null;
  /**
   * Setting the `dev` flag to `true` will
   * enable the development mode for the SDK.
   *
   * This will use sandbox URLs from services to
   * generate quotes.
   */
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

export interface Route extends Omit<ProviderQuoteOption, "paymentMethods">, Omit<PaymentMethodQuote, "steps"> {
  id: string
  status: "HALTING" | "HALTED" | "RUNNING" | "DONE";
  steps: StepExtended[],
}
