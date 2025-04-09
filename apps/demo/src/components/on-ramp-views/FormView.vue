<template>
  <div class="grow flex flex-col gap-2">
    <PanelHeader title="Buy">
      <button v-if="hasRoutes" @click="viewRoutes" type="button" class="cursor-pointer p-1 hover:bg-orange-100 rounded-full text-orange-800 hover:text-orange-700">
        <Icon icon="fluent:book-exclamation-mark-24-regular" class="w-6 h-6" />
      </button>
    </PanelHeader>
    <form class="grow flex flex-col space-y-2 gap-2" @submit="getQuotes">
      <div class="basis-1/3 flex items-center justify-center">
        <span class="font-semibold text-gray-700 text-3xl -mt-6">{{ currencySymbol }}</span>
        <input
          id="amount"
          inputmode="decimal"
          class="text-5xl w-fit text-center font-bold"
          placeholder="0.00"
          ref="input-ref"
          v-model.number="fiatAmount"
        />
      </div>
      <div class="basis-2/3 flex flex-col w-full justify-start gap-4">
        <div @click="openModal" class="cursor-pointer hover:bg-gray-100 border border-gray-200 rounded-2xl p-2">
          <div v-if="toToken" class="flex gap-2">
            <div class="flex items-center justify-center pl-1.5">
              <TokenIcon
                :token="toToken"
                class="h-10 w-10"
              />
            </div>
            <div>
              <span class="block text-sm text-gray-600">Receive</span>
              <span class="font-semibold">
                {{ toToken.symbol }}
                <!-- <span class="font-normal text-sm text-gray-500">{{ toToken.name }}</span> -->
                <span class="font-normal text-gray-600"> on {{ config.chains.find((chain) => chain.id === toToken!.chainId)?.name }}</span>
            </span>
            </div>
          </div>
          <div v-else class="flex gap-2 items-center">
            <div class="flex items-center justify-center pl-1.5">
              <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
            </div>
            <span class="block text-sm text-gray-800 font-bold">Select a token</span>
          </div>
        </div>
        <!-- <div class="mt-4">
          <label for="address" class="block m-0 ps-2 text-gray-600">Send to</label>
          <input
            id="address"
            type="text"
            class="border border-gray-200 rounded-2xl p-2 w-full"
            placeholder="0x..."
            v-model="address"
          />
        </div> -->
        <div class="mt-4 flex gap-2 items-center">
          <div class="grow text-gray-700 text-sm p-2">
            To&nbsp;<span v-if="account.address" class="pl-2">
              {{ shortAddress }}
            </span>
          </div>
          <button v-if="!account.isConnected" class="bg-blue-500 text-white rounded-full p-2 px-4 hover:bg-blue-600 flex items-center justify-center gap-2" type="button" @click="open()">
            <Icon icon="fluent:wallet-24-regular" class="h-5 w-5 inline-block" />
            Connect
          </button>
          <button v-else class="bg-red-300 text-white rounded-full p-2 px-4 hover:bg-red-400 flex items-center justify-center gap-2" type="button" @click="handleDisconnect()">
            Disconnect
          </button>
        </div>
      </div>
      <div class="flex-none">
        <button
          type="submit"
          class="w-full bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 disabled:bg-gray-400"
          :disabled="!account.isConnected || !toToken"
        >
          Get Quotes
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { Icon, } from "@iconify/vue";
import { storeToRefs, } from "pinia";
import type { Address, } from "viem";
import {
  computed, onMounted, useTemplateRef, watch,
} from "vue";
import { useModal, } from "vue-final-modal";

import { useOnRampConfigStore, } from "@/stores/onramp-config";
import { useRoutesStore, } from "@/stores/routes";

import { useConnectorStore, } from "../../stores/connector";
import { useOnRampStore, } from "../../stores/on-ramp";
import { tidyAddress, } from "../../utils/formatters";
import TokenIcon from "../TokenIcon.vue";
import PanelHeader from "../widget/PanelHeader.vue";
import SelectTokensView from "./SelectTokensView.vue";

const { config, } = storeToRefs(useOnRampConfigStore(),);
const { open: openModal, close, } = useModal({
  component: SelectTokensView,
  attrs: {
    onConfirm() {
      close();
    },
  },
},);

const { toToken, selectedCurrency, } = storeToRefs(useOnRampStore(),);

const { fetchQuotes, setStep, } = useOnRampStore();
const { account, } = storeToRefs(useConnectorStore(),);
const { open, handleDisconnect, } = useConnectorStore();

const inputRef = useTemplateRef("input-ref",);
const fiatAmount = defineModel<number>("fiatAmount", { default: 100, },);

const shortAddress = computed(() => {
  if (account.value.address) {
    return tidyAddress(account.value.address,);
  } else {
    return "";
  }
},);

const { routes, } = storeToRefs(useRoutesStore(),);
const hasRoutes = computed(() => Object.keys(routes.value,).length > 0,);

const getQuotes = (e: Event,) => {
  e.preventDefault();
  fetchQuotes({
    fiatAmount: fiatAmount.value,
    toAddress: account.value.address as Address,
    chainId: toToken.value!.chainId,
    toToken: toToken.value!.address,
  },);
};

const adjustInputWidth = () => {
  if (inputRef.value) {
    const valueLength = inputRef.value.value.length;
    inputRef.value.style.width = `${valueLength}ch`;
  }
};

const viewRoutes = () => {
  setStep("transactions",);
};

const currencySymbol = computed(() => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: selectedCurrency.value, },)
    .formatToParts()
    .find((part,) => part.type === "currency",)?.value || "";
},);

watch(() => fiatAmount.value, adjustInputWidth,);

onMounted(() => {
  if (fiatAmount.value) {
    adjustInputWidth();
  }
},);
</script>
