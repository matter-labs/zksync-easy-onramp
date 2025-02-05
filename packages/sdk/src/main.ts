import { zksyncEasyOnRamp, } from "@sdk";
import type { Address, } from "viem";

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
    li.textContent = JSON.stringify(quote, null, 2,);
    resultsList.appendChild(li,);
  },);
},);

zksyncEasyOnRamp.init({
  integrator: "Dev Demo", services: ["kado",], dev: true,
},);
