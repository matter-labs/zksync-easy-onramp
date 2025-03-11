import type { ConfigResponse, Route, } from "@sdk";
import type {
  Address,
  Chain,
} from "viem";
import { createWalletClient, http, } from "viem";
import { privateKeyToAccount, } from "viem/accounts";
import { zksync, } from "viem/chains";

import {
  createOnRampConfig, EVM, executeRoute, fetchConfig, fetchQuotes,
} from "./index";

const account = privateKeyToAccount(import.meta.env.VITE_PRIVATE_KEY as Address,);
const addressInput = document.querySelector("#address",) as HTMLInputElement;
if (addressInput) {
  addressInput.value = account.address;
}
const chains = [zksync,];
const client = createWalletClient({
  account,
  chain: zksync,
  transport: http(),
},);

createOnRampConfig({
  integrator: "Dev Demo",
  services: ["kado",],
  dev: true,
  provider: EVM({
    getWalletClient: async () => client,
    switchChain: async (chainId,) =>
      // Switch chain by creating a new wallet client
      createWalletClient({
        account,
        chain: chains.find((chain,) => chain.id == chainId,) as Chain,
        transport: http(),
      },),
  },),
},);

const onrampConfig = await fetchConfig();
const tokenSelect = document.querySelector("#to-token",) as HTMLSelectElement;
if (tokenSelect) {
  onrampConfig.tokens.filter((token: ConfigResponse["tokens"][0],) => token.chainId === chains[0].id,).slice(0, 10,).forEach((token: ConfigResponse["tokens"][0],) => {
    const option = document.createElement("option",);
    option.value = token.address;
    option.textContent = `${token.symbol} (${token.name})`;
    tokenSelect.appendChild(option,);
  },);
}

const form = document.querySelector("#crypto-onramp-form",);
form?.addEventListener("submit", async (event,) => {
  event.preventDefault();
  const formData = new FormData(form as HTMLFormElement,);
  const fiatAmount = formData.get("fiat-amount",) as string | undefined;
  const toAddress = formData.get("address",);
  const fromChain = 1;
  const toToken = formData.get("to-token",);

  // const order = document.querySelector("#order",);
  const resultsList = document.querySelector("#results-list",);
  if (!resultsList) {
    return;
  }
  resultsList.innerHTML = "Loading...";

  const results = await fetchQuotes({
    fiatAmount: Number(fiatAmount,),
    chainId: Number(fromChain,),
    toAddress: toAddress as Address,
    toToken: toToken as Address,
  },);

  resultsList.innerHTML = ""; // Clear previous results

  results.quotes.forEach((quote,) => {
    const li = document.createElement("li",);
    const button = document.createElement("button",);
    button.textContent = "Execute Quote: " + quote.steps.length + " steps";
    button.addEventListener("click", async () => {
      const results = await executeRoute(quote, {
        onUpdateHook: (route: Route,) => {
          const orderStatusList = document.querySelector("#order-status",);
          if (orderStatusList) {
            orderStatusList.innerHTML = ""; // Clear previous status

            route.steps.forEach((step, index,) => {
              const stepLi = document.createElement("li",);
              stepLi.textContent = `Step ${index + 1}: ${step.type}`;

              const processUl = document.createElement("ul",);
              if (step.execution) {
                step.execution!.process.forEach((process,) => {
                  const processLi = document.createElement("li",);
                  processLi.textContent = `Status: ${process.status}, Message: ${process.message}`;
                  processUl.appendChild(processLi,);
                },);
              }

              stepLi.appendChild(processUl,);
              orderStatusList.appendChild(stepLi,);
            },);
          }
        },
      },);
      console.log("Final results:", JSON.parse(JSON.stringify(results,),),);
    },);
    li.appendChild(button,);
    resultsList.appendChild(li,);
  },);
},);
