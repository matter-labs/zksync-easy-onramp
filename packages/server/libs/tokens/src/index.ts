import type { Address, } from "viem";

export type TokenData = {
  address: Address;
  chainId: number;
  symbol: string;
  name: string;
  decimals: number;
  usdPrice: number;
  marketCap: number;
  iconUrl?: string;
};
export * from "./tokens.module";
export * from "./tokens.service";
export * from "./tokens-data-saver.service";