import { mainnet, zksync, } from "viem/chains";

export const supportedChains = [
  mainnet,
  zksync,
];

export type SupportedChainId = typeof supportedChains[number]["id"];

export const isChainIdSupported = (_chainId: string | number,): boolean => {
  const chainId = typeof _chainId === "string" ? parseInt(_chainId,) : _chainId;
  return supportedChains.some((chain,) => chain.id === chainId,);
};