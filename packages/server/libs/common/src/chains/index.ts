import { mainnet, zksync, } from "viem/chains";

// TODO: cleanup after dev testing
export const supportedChains = [ zksync, mainnet, ];

export type SupportedChainId = typeof supportedChains[number]["id"];

export const isChainIdSupported = (_chainId: string | number,): boolean => {
  const chainId = typeof _chainId === "string" ? parseInt(_chainId,) : _chainId;
  return supportedChains.some((chain,) => chain.id === chainId,);
};
export const getChainById = (chainId: number,): typeof supportedChains[number] | null => {
  return supportedChains.find((chain,) => chain.id === chainId,) || null;
};
