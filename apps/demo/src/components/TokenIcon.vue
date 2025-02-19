<template>
  <div class="border border-gray-200 rounded-full">
    <img :src="token.iconUrl" :alt="token.symbol" />
  </div>
</template>

<script setup lang="ts">

type Token = {
  address: string;
  chainId: number;
  decimals: number;
  symbol: string;
  name: string;
  iconUrl: string;
  [key: string]: unknown;
};

defineProps<{
  token: Token;
}>();
</script>
