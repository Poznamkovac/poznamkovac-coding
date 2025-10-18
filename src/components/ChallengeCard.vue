<script lang="ts">
import { useI18n } from "vue-i18n";
import { defineComponent } from "vue";
import { getLocalizedPath } from "../i18n";
import type { Challenge } from "../types";

export default defineComponent({
  name: "ChallengeCard",

  props: {
    challenge: {
      type: Object as () => Challenge,
      required: true,
    },
    coursePath: {
      type: String,
      required: true,
    },
  },

  setup() {
    const { t } = useI18n();

    return {
      t,
    };
  },

  computed: {
    scorePercentage(): number {
      return this.challenge.maxScore > 0 ? Math.round(((this.challenge.currentScore ?? 0) / this.challenge.maxScore) * 100) : 0;
    },

    isCompleted(): boolean {
      return this.scorePercentage === 100;
    },
  },

  methods: {
    handleClick() {
      const path = getLocalizedPath(`/challenges/${this.coursePath}/${this.challenge.id}`);
      this.$router.push(path);
    },
  },
});
</script>

<template>
  <div
    class="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 cursor-pointer hover:border-gray-600 transition-colors"
    @click="handleClick"
  >
    <div class="flex items-start justify-between mb-2">
      <h3 class="text-lg font-semibold text-white">
        {{ challenge.title }}
      </h3>
      <span v-if="isCompleted" class="text-green-500 text-xl">✓</span>
    </div>
    <div class="flex items-center gap-2 text-sm text-gray-400">
      <span>{{ t("challenge.maxScore") }}: {{ challenge.maxScore }}</span>
      <span v-if="challenge.currentScore !== undefined">
        | {{ t("challenge.currentScore") }}: {{ challenge.currentScore }} ({{ scorePercentage }}%)
      </span>
    </div>
  </div>
</template>
