<template>
  <div class="flex flex-col gap-2 h-full">
    <PanelHeader title="Status" />
    <div class="relative h-full overflow-y-auto">
      <div class="flex flex-col items-center pt-8"><!--   -->
        <VueSpinnerGears v-if="loading || inProgress" size="36" color="#2b7fff" />
        <Icon v-if="!error && results && (!loading || !inProgress)" icon="fluent:checkmark-circle-32-regular" class="w-10 h-10 text-green-700" />
        <Icon v-if="error" icon="fluent:error-circle-24-regular" />
      </div>
      <div v-if="order" class="mt-6">
        <div v-for="step in order.steps" :key="step.id" class="flex flex-col w-[80%] m-auto">
          <div v-for="process in step.execution?.process" :key="process.type" class="flex gap-2 mb-4">
            <div class="w-[24px] shrink-0 text-center">
              <ProcessStatusIcon :status="process.status" />
            </div>
            <div class="text-xs flex items-center">{{ process.message }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon, } from "@iconify/vue";
import { useAsyncState, } from "@vueuse/core";
import { storeToRefs, } from "pinia";
import { onMounted, ref, } from "vue";
import { executeRoute, type Route, } from "zksync-easy-onramp-sdk";

import { useOrderProcessingStore, } from "../../stores/order-processing";
import ProcessStatusIcon from "../on-ramp-components/ProcessStatusIcon.vue";
import PanelHeader from "../widget/PanelHeader.vue";

// const { inProgress, isReady, error, results } = storeToRefs(useOrderProcessingStore());
// const {execute} = useOrderProcessingStore();
const loading = ref<boolean>(true,);
const order = ref<Route | null>();
const { quote, } = storeToRefs(useOrderProcessingStore(),);
const {
  state: results,
  // isReady,
  isLoading: inProgress,
  error,
  execute,
} = useAsyncState(
  async () => {
    if (!quote.value) {
      throw new Error("No order selected",);
    }
    console.log("ordering", quote.value,);
    return await executeRoute(quote.value, {
      onUpdateHook: (executingRoute,) => {
        console.log("exeucting Route", JSON.parse(JSON.stringify(executingRoute,),),);
        order.value = executingRoute;
      },
    },);
  },
  null,
  { immediate: false, },
);

onMounted(() => {
  setTimeout(() => {
    loading.value = false;
    execute();
  }, 1000,);
},);
</script>
