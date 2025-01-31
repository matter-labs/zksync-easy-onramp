import { zksyncEasyOnRamp, } from "@sdk";
import { metaMask, } from "@wagmi/connectors";
import {
  connect,createConfig,disconnect,getConnections,http,
} from "@wagmi/core";
import { zksyncSepoliaTestnet, } from "@wagmi/core/chains";
import type { Address, } from "viem";

export const config = createConfig({
  chains: [zksyncSepoliaTestnet,],
  connectors: [metaMask(),],
  transports: { [zksyncSepoliaTestnet.id]: http(), },
},);

const connectBtn = document.querySelector("#connect",);
connectBtn?.addEventListener("click", async () => {
  const connected = getConnections(config,).length > 0;
  if (!connected) {
    await connect(config, { connector: metaMask(), },);
    connectBtn.innerHTML = "Disconnect";
  } else {
    await disconnect(config,);
    connectBtn.innerHTML = "Connect";
  }
},);

const form = document.querySelector("#crypto-onramp-form",);
form?.addEventListener("submit", async (event,) => {
  event.preventDefault();
  const formData = new FormData(form as HTMLFormElement,);
  const fiatAmount = formData.get("fiat-amount",);
  const currency = formData.get("from-currency",);
  const toAddress = formData.get("address",);
  const fromChain = formData.get("chain",);
  const toToken = formData.get("to-token",);

  const resultsList = document.querySelector("#results-list",);
  resultsList.innerHTML = "Loading...";

  const results = await zksyncEasyOnRamp.fetchQuotes({
    fiatAmount: Number(fiatAmount,),
    fromChain: Number(fromChain,),
    fromCurrency: currency as string,
    toAddress: toAddress as Address,
    toToken: toToken as Address,
  },);

  resultsList.innerHTML = ""; // Clear previous results

  results.quotes.forEach((quote,) => {
    const li = document.createElement("li",);
    li.textContent = JSON.stringify(quote, null, 2,);
    resultsList.appendChild(li,);
  },);
},);

zksyncEasyOnRamp.init({
  integrator: "Dev Demo", services: ["kado",], dev: true,
},);
