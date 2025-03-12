import type { AppKitNetwork, } from "@reown/appkit/networks";
import { WagmiAdapter, } from "@reown/appkit-adapter-wagmi";
import { mainnet, zksync, } from "viem/chains";

export const defaultNetwork = zksync;
// TODO: cleanup after dev testing
export const networks: [AppKitNetwork, ...AppKitNetwork[],] = [ zksync, mainnet, ];

export const wagmiAdapter = new WagmiAdapter({
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  networks,
},);
