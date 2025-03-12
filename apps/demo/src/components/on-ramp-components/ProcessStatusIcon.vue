<template>
  <div class="align-middle inline-block">
    <Icon v-if="status === 'PENDING'" class="text-orange-500 animate-spin" icon="fluent:arrow-clockwise-16-regular" />
    <Icon v-else-if="status === 'ACTION_REQUIRED'" class="text-orange-500 animate-ping" icon="fluent:alert-on-16-regular" />
    <Icon v-else-if="status === 'CANCELLED'" class="text-orange-500" icon="fluent:warning-16-regular" />
    <Icon v-else-if="status === 'FAILED'" class="text-orange-500" icon="fluent:warning-16-regular" />
    <Icon v-else-if="status === 'DONE'" class="text-green-700" icon="fluent:checkmark-circle-16-regular" />
    <Icon v-else class="text-gray-500" icon="fluent:line-horizontal-1-dot-16-filled" />
  </div>
</template>

<script setup lang="ts">
import { Icon, } from "@iconify/vue";
import { defineProps, } from "vue";
import type { ProcessStatus, } from "zksync-easy-onramp";

defineProps<{
  status: ProcessStatus;
}>();
</script>
