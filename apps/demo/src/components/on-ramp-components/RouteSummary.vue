<template>
  <div @click="viewTransaction" class="cursor-pointer border border-gray-400 rounded-2xl flex gap-2 items-center p-2 hover:bg-gray-100 hover:border-gray-500">
    <div>
      <TokenIcon :token="route.receive.token" class="w-10 h-10" />
    </div>
    <div class="flex flex-col grow">
      <div class="flex items-center gap-2">
        <div class="flex items-center">
          <span>{{payAmount}}</span>
      <span class="px-1"><Icon icon="fluent:arrow-right-24-regular" /></span>
      <span>{{ receiveAmount }} {{ route.receive.token.symbol }}</span>
        </div>
      </div>
      <div class="text-[10px]/[12px] text-pretty">
        {{ lastMessage }}
      </div>
    </div>
    <div>
      <Icon icon="fluent:chevron-right-24-regular" class="h-10 w-10 text-gray-500" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon, } from "@iconify/vue";
import { storeToRefs, } from "pinia";
import { computed, } from "vue";
import type { Route, } from "zksync-easy-onramp";

import { useOnRampStore, } from "@/stores/on-ramp";
import { useTransactionStore, } from "@/stores/transaction";
import { formatFiat, formatToken, } from "@/utils/format-value";

import TokenIcon from "../TokenIcon.vue";
const props = defineProps<{ route: Route, }>();

const lastMessage = computed(() => {
  const lastStep = props.route.steps[props.route.steps.length - 1];
  return lastStep.execution?.process[lastStep.execution.process.length - 1].message;
},);

const { setStep, } = useOnRampStore();
const { transaction, } = storeToRefs(useTransactionStore(),);
const viewTransaction = () => {
  transaction.value = props.route;
  setStep("transaction",);
};

const payAmount = computed(() => {
  if (props.route) {
    return formatFiat(props.route.pay.fiatAmount ?? 0, props.route.pay.currency,);
  }
  return null;
},);

const receiveAmount = computed(() => {
  if (props.route) {
    return formatToken(props.route.receive.amountUnits ?? 0, props.route.receive.token.decimals,);
  }
  return null;
},);
</script>
