<template>
  <div class="flex flex-col gap-2 h-full">
    <PanelHeader title="Status" back="buy"/>
    <div class="relative h-full overflow-y-auto">
      <div class="flex flex-col items-center pt-8"><!--   -->
        <VueSpinnerGears v-if="loading || inProgress" size="36" color="#2b7fff" />
        <Icon v-if="!error && results && (!loading || !inProgress)" icon="fluent:checkmark-circle-32-regular" class="w-10 h-10 text-green-700" />
        <Icon v-if="error && !inProgress && !loading" icon="fluent:error-circle-24-regular" class="w-10 h-10 text-orange-500"/>
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
    <div v-if="error" class="flex gap-2">
      <button @click="restartRoute" class="w-full bg-blue-500 text-white rounded-full p-2 px-4 hover:bg-blue-600 flex items-center justify-center gap-2">Try again</button>
      <button @click="removeTransaction" type="button" class="cursor-pointer shrink bg-red-600/70 text-white rounded-full px-3 p-2 hover:bg-red-600">
        <Icon icon="fluent:delete-24-regular" class="w-6 h-6" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon, } from "@iconify/vue";
import { storeToRefs, } from "pinia";
import { onMounted, ref, } from "vue";

import { useOnRampStore, } from "@/stores/on-ramp";
import { useRoutesStore, } from "@/stores/routes";

import { useOrderProcessingStore, } from "../../stores/order-processing";
import ProcessStatusIcon from "../on-ramp-components/ProcessStatusIcon.vue";
import PanelHeader from "../widget/PanelHeader.vue";

const loading = ref<boolean>(true,);
const {
  order, error, results, inProgress,
} = storeToRefs(useOrderProcessingStore(),);
const { execute, } = useOrderProcessingStore();

const { setStep, } = useOnRampStore();
const { removeRoute, } = useRoutesStore();
const removeTransaction = () => {
  const routeId = order.value!.id;
  removeRoute(routeId,);
  setStep("buy",);
};

const restartRoute = () => {
  execute();
};

onMounted(() => {
  setTimeout(() => {
    loading.value = false;
    execute();
  }, 1000,);
},);
</script>
