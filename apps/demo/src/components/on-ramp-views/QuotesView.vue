<template>
  <div class="flex flex-col gap-2 h-full">
    <PanelHeader title="Quotes" back="buy" />
    <div class="relative h-full overflow-y-auto">
      <Transition mode="out-in">
        <div v-if="inProgress" class="absolute inset-0 flex pt-8 justify-center">
          <VueSpinnerHourglass size="36" color="#2b7fff" />
        </div>
        <div v-else-if="!inProgress && !error" class="flex flex-col gap-2">
          <template v-if="quotes.length === 0">
            <div class="flex flex-col items-center pt-8">
              <span class="text-gray-600 text-sm">No quotes are available.</span>
            </div>
          </template>
          <template v-else>
            <template v-for="(providerQuotes, index) in sortedQuotes" :key="index">
              <QuoteOption v-for="(quote, index) in providerQuotes.paymentMethods" :key="index" :quote="quote!" :provider="providerQuotes.provider"/>
            </template>
          </template>
        </div>
        <div v-else-if="error" class="flex flex-col items-center pt-8">
          <span class="text-red-600 text-sm">{{ error }}</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs, } from "pinia";
import { computed, } from "vue";
import { sortByFees, } from "zksync-easy-onramp";

import { useQuotesStore, } from "../../stores/quotes";
import QuoteOption from "../on-ramp-components/QuoteOption.vue";
import PanelHeader from "../widget/PanelHeader.vue";

const {
  quotes, inProgress, error,
} = storeToRefs(useQuotesStore(),);

const sortedQuotes = computed(() => {
  return sortByFees(quotes.value, false,);
},);
</script>

<style scoped></style>
