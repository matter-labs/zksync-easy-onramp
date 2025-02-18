<template>
  <div class="flex flex-col gap-2 h-full">
    <PanelHeader title="Status" />
    <div class="relative h-full overflow-y-auto">
      <div v-if="loading || inProgress" class="flex flex-col items-center pt-8">
        <VueSpinnerGears size="36" color="#2b7fff" />
        <br />
        <span class="text-gray-600 text-sm">Executing order...</span>
        <span v-if="order" v-for="step in order.steps">
          {{ step.execution!.status }} - {{ step.execution!.message }}
        </span>
      </div>
      <div v-if="isReady">
        Order is completed!
        {{ results }}
      </div>
      <div v-if="error">
        An error occurred. {{ order!.steps[0].execution!.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import PanelHeader from "../widget/PanelHeader.vue";
import { useOrderProcessingStore } from "../../stores/order-processing";
import { storeToRefs } from "pinia";
import { useAsyncState } from "@vueuse/core";
import { executeQuote, type Route } from "zksync-easy-onramp-sdk";

// const { inProgress, isReady, error, results } = storeToRefs(useOrderProcessingStore());
// const {execute} = useOrderProcessingStore();
const loading = ref<boolean>(true);
const order = ref<Route | null>();
const { quote } = storeToRefs(useOrderProcessingStore());
const {
  state: results,
  isReady,
  isLoading: inProgress,
  error,
  execute,
} = useAsyncState(
  async () => {
    if (!quote.value) {
      throw new Error("No order selected");
    }
    console.log("ordering", quote.value);
    return await executeQuote(quote.value, {
      onUpdateHook: (executingOrder) => {
        order.value = executingOrder.route;
      },
    });
  },
  null,
  { immediate: false },
);

onMounted(() => {
  console.log("mounted");
  console.log("executing");
  setTimeout(() => {
    loading.value = false;
    execute();
  }, 1000);
});
</script>
