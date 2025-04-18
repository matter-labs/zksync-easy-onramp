<template>
  <div
    class="border border-gray-200 rounded-2xl p-4 shadow hover:shadow-md hover:border-gray-300 cursor-pointer"
    @click="executeQuote"
  >
    <div class="flex gap-2 items-center relative">
      <TokenIcon :token="quote.receive.token" class="w-10 h-10 mr-2" />
      <div class="flex flex-col gap-0.5">
        <span class="font-semibold text-2xl">{{ receiveAmount }}</span>
        <span class="text-sm text-gray-600">
          {{ quote.steps.length }} {{ quote.steps.length > 1 ? 'steps' : 'step' }} via
          <span class="font-semibold">{{ provider.name }}</span>
          <span class="text-xs block">{{ paymentMethod }}</span>
        </span>
      </div>
      <div class="absolute top-0 right-0 text-gray-600 text-sm flex items-center">
        <Icon icon="fluent:coin-multiple-24-regular" />
        ~{{ formattedTotalFeeFiat }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon, } from "@iconify/vue";
import { storeToRefs, } from "pinia";
import { formatUnits, parseUnits, } from "viem";
import { computed, } from "vue";
import { type ProviderQuoteOption,quoteToRoute,  } from "zksync-easy-onramp";

import { parsePaymentMethod, } from "@/utils/payment-method";

import { useOnRampStore, } from "../../stores/on-ramp";
import { useOrderProcessingStore, } from "../../stores/order-processing";
import TokenIcon from "../TokenIcon.vue";

const props = defineProps<{
  quote: ProviderQuoteOption["paymentMethods"][0];
  provider: ProviderQuoteOption["provider"];
}>();

const receiveAmount = computed(() => {
  const amount = formatUnits(
    parseUnits(props.quote.receive.amountUnits, 0,),
    props.quote.receive.token.decimals,
  );
  return parseFloat(amount,).toFixed(6,);
},);

const { selectedCurrency, } = storeToRefs(useOnRampStore(),);
const formattedTotalFeeFiat = computed(() => {
  const totalFeeFiat = parseFloat(props.quote.pay.totalFeeFiat.toString(),);
  return totalFeeFiat.toLocaleString("en-US", {
    style: "currency",
    currency: selectedCurrency.value,
  },);
},);

const { setStep, } = useOnRampStore();
const { selectQuote, } = useOrderProcessingStore();
const executeQuote = () => {
  const routeToExecute = quoteToRoute("buy", props.quote, props.provider,);
  selectQuote(routeToExecute,);
  setStep("processing",);
};

const paymentMethod = computed(() => {
  return parsePaymentMethod(props.quote.method,);
},);
</script>
