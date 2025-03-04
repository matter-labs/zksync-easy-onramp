import type { AppKitNetwork } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, optimism, zksync } from "viem/chains";

export const defaultNetwork = zksync;
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  zksync,
  optimism,
];

export const wagmiAdapter = new WagmiAdapter({
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  networks,
});
