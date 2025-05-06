import {
  createAppKit, useAppKit, useAppKitAccount,
  useDisconnect,
} from "@reown/appkit/vue";
import { getWalletClient, switchChain, } from "@wagmi/vue/actions";
import { defineStore, } from "pinia";
import { createOnRampConfig, EVM, } from "zksync-easy-onramp";

import {
  defaultNetwork, networks, wagmiAdapter,
} from "@/utils/wagmi-adapter";

const metadata = {
  name: "ZKsync Easy OnRamp",
  description: "Easy OnRamp to ZKsync Elastic Network",
  url: "https://zksync.io",
  icons: ["https://portal.zksync.io/icon.png",],
};

createAppKit({
  adapters: [wagmiAdapter,],
  networks,
  defaultNetwork,
  metadata,
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  features: {
    email: false,
    socials: false,
    send: false,
    swaps: false,
  },
},);

createOnRampConfig({
  integrator: "ZKsync Easy OnRamp Demo",
  apiUrl: "http://localhost:3020/api",
  // services: [ "test", "transak", ],
  provider: EVM({
    getWalletClient: async () => getWalletClient(wagmiAdapter.wagmiConfig,),
    switchChain: async (chainId,) => {
      const chain = await switchChain(wagmiAdapter.wagmiConfig, { chainId, },);
      return await getWalletClient(wagmiAdapter.wagmiConfig, { chainId: chain.id, },);
    },
  },),
  dev: true,
},);

export const useConnectorStore = defineStore("connector", () => {
  const adapter = wagmiAdapter;

  const { open, close, } = useAppKit();

  const account = useAppKitAccount();

  const { disconnect, } = useDisconnect();
  const handleDisconnect = async function () {
    try {
      await disconnect();
    } catch (error: unknown) {
      console.error(error,);
    }
  };

  return {
    account,
    adapter,
    open,
    close,
    handleDisconnect,
  };
},);
