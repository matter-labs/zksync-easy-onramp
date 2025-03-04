import { defineStore } from "pinia";
import { ref } from "vue";
import type { Route } from "zksync-easy-onramp";

export const useTransactionStore = defineStore("transaction", () => {
  const transaction = ref<Route | null>(null);

  return { transaction };
});
