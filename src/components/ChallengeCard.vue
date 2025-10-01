<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useI18nStore } from "../stores/i18n";
import type { Challenge } from "../types";

const props = defineProps<{
  challenge: Challenge;
  coursePath: string;
}>();

const router = useRouter();
const i18nStore = useI18nStore();

const handleClick = () => {
  const path = i18nStore.getLocalizedPath(`/challenges/${props.coursePath}/${props.challenge.id}`);
  router.push(path);
};

const scorePercentage = computed(() => {
  if (props.challenge.currentScore !== undefined && props.challenge.maxScore > 0) {
    return Math.round((props.challenge.currentScore / props.challenge.maxScore) * 100);
  }
  return 0;
});

const isCompleted = computed(() => scorePercentage.value === 100);
</script>

<template>
  <div
    class="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 cursor-pointer hover:border-gray-600 transition-colors"
    @click="handleClick"
  >
    <div class="flex items-start justify-between mb-2">
      <h3 class="text-lg font-semibold text-white">{{ challenge.title }}</h3>
      <span v-if="isCompleted" class="text-green-500 text-xl">✓</span>
    </div>
    <div class="flex items-center gap-2 text-sm text-gray-400">
      <span>Max score: {{ challenge.maxScore }}</span>
      <span v-if="challenge.currentScore !== undefined">
        | Current: {{ challenge.currentScore }} ({{ scorePercentage }}%)
      </span>
    </div>
  </div>
</template>
