<template>
  <VueFinalModal
      class="confirm-modal"
      content-class="confirm-modal-content"
      overlay-transition="vfm-fade"
      content-transition="vfm-fade"
    >
    <button type="button" class="absolute top-1 right-1 cursor-pointer hover:bg-gray-100 rounded-full p-0.5">
      <Icon icon="fluent:dismiss-24-regular" class="w-6 h-6" @click="emit('confirm')" />
    </button>
    <div v-if="isReady && !inProgress" class="flex flex-col h-full">
      <div class="shrink">
        <strong>Select network</strong>
        <div class="flex gap-2">
          <div v-for="chain in config.chains" @click="selectChain(chain.id)" :key="chain.id" class="text-sm cursor-pointer px-4 py-0.5 border border-gray-200 rounded-2xl" :class="{'bg-blue-300': selectedChain === chain.id}">
            {{ chain.name}}
          </div>
        </div>
      </div>
      <strong class="mt-2">Select token:</strong>
      <input type="text" placeholder="search" class="px-2 py-1 mb-2 border border-gray-400 rounded-xl" @input="searchToken" />
      <div class="overflow-y-auto flex flex-col gap-2 p-2">
        <div v-for="token in filteredTokens" :key="token.address" @click="selectToken(token)" class="flex gap-2 border border-gray-300 rounded-xl px-2 py-1 items-center cursor-pointer hover:bg-gray-100">
          <TokenIcon :token="token" class="h-8 w-8" />
          <!-- <img class="h-8 w-8" :src="token.iconUrl" /> -->
          <div class="flex flex-col">
            <span class="text-lg">{{ token.symbol }}</span>
            <span class="text-xs" :title="token.address">{{ token.name }}</span>
          </div>
        </div>
        <div v-if="searchValue === ''" class="text-center text-gray-500">
          Search to find more tokens
        </div>
      </div>
      <!-- <button @click="emit('confirm')">
        Confirm
      </button> -->
    </div>
    <div v-if="inProgress" class="w-full h-full flex items-center justify-center">
      <VueSpinnerOval size="36" color="#2b7fff" />
    </div>
    </VueFinalModal>
</template>

<script setup lang="ts">
import { Icon, } from "@iconify/vue";
import { storeToRefs, } from "pinia";
import {
  computed, ref, watchEffect,
} from "vue";
import { VueFinalModal, } from "vue-final-modal";
import { VueSpinnerOval, } from "vue3-spinners";
import type { ConfigResponse, } from "zksync-easy-onramp";

import TokenIcon from "@/components/TokenIcon.vue";
import { useOnRampStore, } from "@/stores/on-ramp.ts";
import { useOnRampConfigStore, } from "@/stores/onramp-config";

const { toToken, } = storeToRefs(useOnRampStore(),);
const emit = defineEmits<{
  (e: "confirm"): void
}>();
const selectToken = (token: ConfigResponse["tokens"][0],) => {
  console.log("token", token,);
  toToken.value = token;
  setTimeout(() => {
    emit("confirm",);
  }, 0,);
};

const {
  config, inProgress, isReady,
} = useOnRampConfigStore();

const filteredTokens = computed(() => {
  if (searchValue.value !== "") {
    return config.tokens.filter((token,) => token.chainId === selectedChain.value,).filter((token,) => token.name.toLowerCase().includes(searchValue.value.toLowerCase(),) || token.symbol.toLowerCase().includes(searchValue.value.toLowerCase(),),);
  } else {
    return config.tokens.filter((token,) => token.chainId === selectedChain.value,).slice(0, 50,);
  }
},);

const selectedChain = ref<number | null>(null,);
const selectChain = (chainId: number,) => {
  selectedChain.value = chainId;
};

watchEffect(() => {
  if (isReady && !inProgress) {
    selectedChain.value = config.chains[0].id;
  }
},);

const searchValue = ref("",);
const searchToken = (e: Event,) => {
  searchValue.value = (e.target as HTMLInputElement).value;
};
</script>

<style>
  .confirm-modal {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .confirm-modal-content {
    position: relative;
    width: 70vw;
    height: 45dvh;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background: #fff;
    border-radius: 0.5rem;
  }
  .confirm-modal-content > * + *{
    margin: 0.5rem 0;
  }
  .confirm-modal-content h1 {
    font-size: 1.375rem;
  }
  .dark .confirm-modal-content {
    background: #000;
  }
  </style>
