<template>
  <div class="border border-gray-200 rounded-2xl shadow-xl w-panel-width relative h-panel-height">
    <div class="absolute inset-0 p-4 flex flex-col justify-stretch items-stretch">
      <Transition mode="out-in">
        <BuyView v-if="step === 'buy'" />
        <QuotesView v-else-if="step === 'quotes'" />
        <OrderStatusView v-else-if="step === 'processing'" />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import { useOnRampStore } from "../../stores/on-ramp";
import BuyView from "../on-ramp-views/BuyView.vue";
import OrderStatusView from "../on-ramp-views/OrderStatusView.vue";
import QuotesView from "../on-ramp-views/QuotesView.vue";

const { step } = storeToRefs(useOnRampStore());
</script>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.15s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
