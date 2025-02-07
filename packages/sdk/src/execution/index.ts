import type { ExecutionOptions, } from "@sdk/execution/state";
import { ExecutionState, } from "@sdk/execution/state";
import type { ProviderQuoteOption, } from "@sdk/types/server";

export type { ExecutionOptions, } from "@sdk/execution/state";

let executionState = null;

export async function executeQuote(quote: ProviderQuoteOption, options?: ExecutionOptions,) {
  console.log("EXECUTING?",);
  executionState = new ExecutionState(quote, options,);
  return executionState.execute();
}
