<template>
  <div class="flex flex-col gap-2 h-full">
    <PanelHeader
      title="Status"
      back="buy"
    >
      <button
        @click="stopRoute()"
        type="button"
        class="cursor-pointer shrink rounded-full px-3 p-2"
      >
        <Icon
          icon="fluent:record-stop-32-filled"
          class="w-6 h-6 text-red-600/50 hover:text-red-600"
        />
      </button>
    </PanelHeader>
    <div class="relative h-full overflow-y-auto">
      <div class="flex flex-col items-center pt-8">
        <VueSpinnerGears
          v-if="orderStatus === 'IN_PROGRESS' || orderStatus === 'PENDING'"
          size="36"
          color="#2b7fff"
        />
        <div v-if="orderStatus === 'DONE'">
          <!--   -->
          <Icon
            v-if="!error && isReady"
            icon="fluent:checkmark-circle-32-regular"
            class="w-10 h-10 text-green-700"
          />
          <Icon
            v-if="error && isReady"
            icon="fluent:error-circle-24-regular"
            class="w-10 h-10 text-orange-500"
          />
        </div>
        <div v-if="orderStatus === 'STOPPED'">
          <!--   -->
          <Icon
            icon="fluent:error-circle-24-regular"
            class="w-10 h-10 text-orange-500"
          />
        </div>
      </div>
      <div
        v-if="order"
        class="mt-6"
      >
        <div
          v-for="step in order.steps"
          :key="step.id"
          class="flex flex-col w-[80%] m-auto"
        >
          <div
            v-for="process in step.execution?.process"
            :key="process.type"
            class="flex gap-2 mb-4"
          >
            <div class="w-[24px] shrink-0 text-center">
              <ProcessStatusIcon :status="process.status" />
            </div>
            <div class="text-xs flex items-center">{{ process.message }}</div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="orderStatus !== 'DONE' && !initializing && (error || !inProgress)"
      class="flex gap-2"
    >
      <button
        @click="restartRoute"
        class="w-full bg-blue-500 text-white rounded-full p-2 px-4 hover:bg-blue-600 flex items-center justify-center gap-2"
      >
        Try again
      </button>
      <button
        @click="removeTransaction"
        type="button"
        class="cursor-pointer shrink bg-red-600/70 text-white rounded-full px-3 p-2 hover:bg-red-600"
      >
        <Icon
          icon="fluent:delete-24-regular"
          class="w-6 h-6"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { storeToRefs } from "pinia";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { stopRouteExecution } from "zksync-easy-onramp";

import { useOnRampStore } from "@/stores/on-ramp";
import { useRoutesStore } from "@/stores/routes";

import { useOrderProcessingStore } from "../../stores/order-processing";
import ProcessStatusIcon from "../on-ramp-components/ProcessStatusIcon.vue";
import PanelHeader from "../widget/PanelHeader.vue";

const { order, error, isReady, inProgress, orderStatus } = storeToRefs(
  useOrderProcessingStore(),
);
const { execute, stopRoute } = useOrderProcessingStore();

const { setStep } = useOnRampStore();
const { removeRoute } = useRoutesStore();
const removeTransaction = () => {
  const routeId = order.value!.id;
  removeRoute(routeId);
  setStep("buy");
};

const restartRoute = () => {
  execute();
};

const initializing = ref<boolean>(true);
onMounted(() => {
  setTimeout(() => {
    initializing.value = false;
    if (orderStatus.value !== "DONE") {
      execute();
    }
  }, 1000);
});

onBeforeUnmount(() => {
  // updateRouteExecution(order.value!, { executeInBackground: true, },);
  stopRouteExecution(order.value!.id);
});
</script>
