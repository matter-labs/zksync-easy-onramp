import { formatUnits, } from "viem";

export const formatFiat = function (value: number, currency: string,) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, },).format(value,);
};

export const formatToken = function (value: number | string, decimals: number,) {
  const bigValue = BigInt(value,);

  return parseFloat(formatUnits(bigValue, decimals,),).toFixed(6,);
};
