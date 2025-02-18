<template>
  <div class="grow flex flex-col gap-2">
    <PanelHeader title="Buy" />
    <form class="grow flex flex-col space-y-2 gap-2" @submit="getQuotes">
      <div class="flex items-center justify-center">
        <span class="font-semibold text-gray-700 text-3xl -mt-6">$</span>
        <input
          id="amount"
          inputmode="decimal"
          class="text-5xl w-fit text-center font-bold"
          placeholder="0.00"
          ref="input-ref"
          v-model="fiatAmount"
        />
      </div>
      <div class="grow flex flex-col w-full justify-center gap-4">
        <div class="border border-gray-200 rounded-2xl p-2 flex gap-2">
          <div class="flex items-center justify-center pl-1.5">
            <img
              src="../../assets/eth-token.svg"
              alt="Ethereum Token"
              class="w-10 h-10 inline-block mr-2"
            />
          </div>
          <div>
            <span class="block text-sm text-gray-600">Receive</span>
            <span class="font-semibold">Ethereum</span>
          </div>
        </div>
        <div class="mt-4">
          <label for="address" class="block m-0 ps-2 text-gray-600">Send to</label>
          <input
            id="address"
            type="text"
            class="border border-gray-200 rounded-2xl p-2 w-full"
            placeholder="0x..."
            v-model="address"
          />
        </div>
      </div>
      <div class="flex-none">
        <button
          type="submit"
          class="w-full bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600"
        >
          Get Quotes
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Address, } from "viem";
import {
  onMounted, useTemplateRef, watch,
} from "vue";

import { useOnRampStore, } from "../../stores/on-ramp";
import PanelHeader from "../widget/PanelHeader.vue";

const { fetchQuotes, } = useOnRampStore();

const inputRef = useTemplateRef("input-ref",);
const fiatAmount = defineModel<string>("fiatAmount", { default: "100", },);
const address = defineModel<Address>("address", { default: "0x1BDea3773039Fce568CEc019f2C8733CCd0B4431", },);

const getQuotes = (e: Event,) => {
  e.preventDefault();
  fetchQuotes({
    fiatAmount: +fiatAmount.value,
    toAddress: address.value,
    chainId: 1,
    fiatCurrency: "USD",
    toToken: "0x0000000000000000000000000000000000000000",
  },);
};

const adjustInputWidth = () => {
  if (inputRef.value) {
    const valueLength = inputRef.value.value.length;
    inputRef.value.style.width = `${valueLength}ch`;
  }
};

watch(() => fiatAmount.value, adjustInputWidth,);

onMounted(() => {
  if (fiatAmount.value) {
    adjustInputWidth();
  }
},);
</script>
