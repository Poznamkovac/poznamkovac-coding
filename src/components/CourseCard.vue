<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "../composables/useI18n";
import { useI18nStore } from "../stores/i18n";
import type { Course } from "../types";

const props = defineProps<{
  course: Course;
}>();

const router = useRouter();
const { t, effectiveLanguage } = useI18n();
const i18nStore = useI18nStore();

const handleClick = () => {
  const path = i18nStore.getLocalizedPath(`/challenges/${props.course.slug}`);
  router.push(path);
};

const challengeCountText = computed(() => {
  if (props.course.challengeCount === undefined) return "";

  const count = props.course.challengeCount;

  if (effectiveLanguage.value === "sk") {
    if (count === 1) {
      return t("course.challengeCountSingular", { count });
    } else if (count >= 2 && count <= 4) {
      return t("course.challengeCountFew", { count });
    } else {
      return t("course.challengeCount", { count });
    }
  } else {
    if (count === 1) {
      return t("course.challengeCountSingular", { count });
    } else {
      return t("course.challengeCount", { count });
    }
  }
});
</script>

<template>
  <div
    class="rounded-lg p-6 cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg"
    :style="{ backgroundColor: course.color }"
    @click="handleClick"
  >
    <h3 class="text-2xl font-bold text-white mb-2">{{ course.title }}</h3>
    <p v-if="course.challengeCount !== undefined" class="text-white/80">
      {{ challengeCountText }}
    </p>
  </div>
</template>
