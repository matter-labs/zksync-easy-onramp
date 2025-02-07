<template>
  <div class="flex flex-col gap-2 h-full">
    <PanelHeader title="Quotes" back="buy" />
    <div class="relative h-full overflow-y-auto">
      <Transition mode="out-in">
        <div
          v-if="inProgress"
          class="absolute inset-0 flex pt-8 justify-center">
          <VueSpinnerHourglass size="36" color="#2b7fff" />
        </div>
        <div v-else-if="!inProgress && !error" class="flex flex-col gap-2">
          <QuoteOption v-for="quote in quotes" :quote="quote!" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import { useQuotesStore } from "../../stores/quotes";
import PanelHeader from "../widget/PanelHeader.vue";
import QuoteOption from "../on-ramp-components/QuoteOption.vue";

const { quotes, inProgress, error } = storeToRefs(useQuotesStore());
</script>

<style scoped></style>
