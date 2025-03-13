<script setup lang="ts">
import { ModalsContainer, } from "vue-final-modal";
import { RouterView, } from "vue-router";
</script>

<template>
  <div class="flex h-dvh w-dvw flex-col bg-gray-100/20">
    <header class="p-4">
      <h1 class="text-center text-xl">ZKsync Easy OnRamp Demo</h1>
    </header>
    <div class="grow flex items-center justify-center">
      <RouterView />
    </div>
    <ModalsContainer />
  </div>
</template>
