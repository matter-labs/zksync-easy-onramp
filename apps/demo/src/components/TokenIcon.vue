<template>
  <div class="rounded-full overflow-hidden" :class="{ 'border-1 border-gray-300' : !token.iconUrl }">
    <img v-if="token.iconUrl" :src="token.iconUrl" :alt="token.symbol" class="object-contain"/>
    <span class="align-middle w-full h-full inline-block text-center text-xs/9.5 bg-gray-100 text-gray-700" v-else>{{ token.symbol }}</span>
  </div>
</template>

<script setup lang="ts">

type TokenIcon = {
  symbol: string;
  iconUrl?: string;
};

defineProps<{
  token: TokenIcon;
}>();
</script>
