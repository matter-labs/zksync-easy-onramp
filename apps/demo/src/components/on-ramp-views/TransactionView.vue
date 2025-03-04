<template>
  <div class="flex flex-col gap-2 h-full">
    <PanelHeader
      title="Transaction"
      back="transactions"
    />
    <div
      class="relative h-full overflow-y-auto"
      v-if="transaction"
    >
      <div class="flex gap-2 items-center">
        <TokenIcon
          :token="transaction.receive.token"
          class="w-10 h-10"
        />
        <div>
          <div class="flex items-center">
            <span>{{ payAmount }}</span>
            <span class="px-1"
              ><Icon icon="fluent:arrow-right-24-regular"
            /></span>
            <span
              >{{ receiveAmount }} {{ transaction.receive.token.symbol }}</span
            >
          </div>
        </div>
      </div>
      <div class="pl-12">Purchase via {{ transaction.provider.name }}</div>
      <div class="text-[10px]/[12px] pl-12 flex gap-2 mt-4 w-[90%] text-pretty">
        <Icon
          class="inline-block text-orange-500 w-4 h-4"
          icon="fluent:warning-16-regular"
        />
        {{ lastMessage }}
      </div>
    </div>
    <div class="flex gap-2">
      <button
        @click="restartRoute"
        type="button"
        class="cursor-pointer grow w-full bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600"
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
import { computed } from "vue";

import { useOnRampStore } from "@/stores/on-ramp";
import { useOrderProcessingStore } from "@/stores/order-processing";
import { useRoutesStore } from "@/stores/routes";
import { useTransactionStore } from "@/stores/transaction";
import { formatFiat, formatToken } from "@/utils/format-value";

import TokenIcon from "../TokenIcon.vue";
import PanelHeader from "../widget/PanelHeader.vue";

const { transaction } = storeToRefs(useTransactionStore());
const lastMessage = computed(() => {
  const failedStep = transaction.value?.steps.find(
    (step) => step.execution?.status !== "DONE",
  );
  console.log(transaction.value?.steps);
  return (
    failedStep?.execution?.process[failedStep.execution.process.length - 1]
      .message ||
    failedStep?.execution?.process[failedStep.execution.process.length - 1]
      .error.message
  );
});

const payAmount = computed(() => {
  if (transaction.value) {
    return formatFiat(
      transaction.value.pay.fiatAmount ?? 0,
      transaction.value.pay.currency,
    );
  }
  return null;
});

const receiveAmount = computed(() => {
  if (transaction.value) {
    return formatToken(
      transaction.value.receive.amountUnits ?? 0,
      transaction.value.receive.token.decimals,
    );
  }
  return null;
});

const { setStep } = useOnRampStore();
const { removeRoute } = useRoutesStore();
const removeTransaction = () => {
  const routeId = transaction.value!.id;
  removeRoute(routeId);
  setStep("transactions");
};

const { selectQuote } = useOrderProcessingStore();
const restartRoute = () => {
  selectQuote(transaction.value!);
  setStep("processing");
};
</script>
