<template>
  <div class="relative">
    <div class="absolute left-0" v-if="props.back">
      <button @click="changeView">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
    </div>
    <h2 class="text-lg font-semibold text-center">{{ props.title }}</h2>
  </div>
</template>

<script setup lang="ts">
import { type Steps, useOnRampStore, } from "../../stores/on-ramp";

const { setStep, } = useOnRampStore();
const props = defineProps<{
  title: string;
  back?: Steps;
}>();

const changeView = () => {
  console.log("change view",);
  setStep(props.back!,);
};
</script>
