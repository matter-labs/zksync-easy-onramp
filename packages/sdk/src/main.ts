import { zksyncEasyOnRamp, } from "@sdk";
import type { Address, } from "viem";

import { executeQuote, } from "./execution";

const form = document.querySelector("#crypto-onramp-form",);
form?.addEventListener("submit", async (event,) => {
  event.preventDefault();
  const formData = new FormData(form as HTMLFormElement,);
  const fiatAmount = formData.get("fiat-amount",);
  const currency = formData.get("from-currency",);
  const toAddress = formData.get("address",);
  const fromChain = formData.get("chain",);
  const toToken = formData.get("to-token",);

  const order = document.querySelector("#order",);
  const resultsList = document.querySelector("#results-list",);
  if (!resultsList) {
    return;
  }
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
    const button = document.createElement("button",);
    button.textContent = "Execute Quote";
    button.addEventListener("click", async () => {
      const results = await executeQuote(quote, {
        onUpdateHook: (executionOrder,) => {
          if (executionOrder.status === "IN_PROGRESS") {
            (resultsList as HTMLElement).style.display = "none";
            order!.innerHTML = "Loading...";
          }
          if ([
            "FAILED",
            "DONE",
            "CANCELLED",
          ].includes(executionOrder.status,)) {
            (resultsList as HTMLElement).style.display = "block";
            order!.innerHTML = `Order is ${executionOrder.status}`;
          }
        },
      },);
      console.log("RESULTS", results,);
    },);
    li.appendChild(button,);
    resultsList.appendChild(li,);
  },);
},);

zksyncEasyOnRamp.init({
  integrator: "Dev Demo", services: ["kado",], dev: true,
},);
