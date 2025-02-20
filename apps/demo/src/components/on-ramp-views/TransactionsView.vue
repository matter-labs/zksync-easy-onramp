<template>
  <div class="flex flex-col gap-2 h-full">
    <PanelHeader title="Active Transactions"  back="buy" />
    <div class="relative h-full overflow-y-auto">
      <div v-for="route in routes" :key="route.id">
        <RouteSummary :route="route" class="my-2" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs, } from "pinia";
import { onMounted, } from "vue";

import { useOnRampStore, } from "@/stores/on-ramp";

import { useRoutesStore, } from "../../stores/routes";
import RouteSummary from "../on-ramp-components/RouteSummary.vue";
import PanelHeader from "../widget/PanelHeader.vue";
const { routes, } = storeToRefs(useRoutesStore(),);

const { setStep, } = useOnRampStore();
onMounted(() => {
  if (routes.value.length === 0) {
    setStep("buy",);
  }
},);
</script>
