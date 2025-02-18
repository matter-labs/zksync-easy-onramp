import { formatUnits, parseUnits, } from "viem";

export function formatMulticallError(error: Error,) {
  if (error.message
    .replace("\n"," ",)
    .includes("The contract function \"aggregate3\" reverted with the following reason: sanctioned",)) {
    return new Error("Sanctioned",);
  } else if (error.message.includes("is out of bounds (`0 < position < 32`)",)) {
    return new Error("Onchain data type doesn't match the expected one",);
  } else if (error.message.includes("ContractFunctionExecutionError: The contract function",) && error.message.includes("reverted.",)) {
    return new Error("Contract function reverted",);
  }
  return error;
}

export function getFiatTokenAmount(amount: string, token: { decimals: number; price: number },) {
  return Number(formatUnits(BigInt(amount,), token.decimals,),) * token.price;
}

export function getTokenAmountFromFiat(fiatAmount: number, token: { decimals: number; price: number },) {
  return parseUnits((fiatAmount / token.price).toFixed(token.decimals,), token.decimals,).toString();
}