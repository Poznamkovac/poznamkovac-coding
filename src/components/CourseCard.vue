<script lang="ts">
import { defineComponent } from "vue";
import { useI18nStore } from "../stores/i18n";
import { storeToRefs } from "pinia";
import type { Course } from "../types";
import { Color } from "@kurkle/color";

export default defineComponent({
  name: "CourseCard",

  props: {
    course: {
      type: Object as () => Course,
      required: true,
    },
  },

  setup() {
    const i18nStore = useI18nStore();
    const { language: effectiveLanguage } = storeToRefs(i18nStore);

    return {
      i18nStore,
      effectiveLanguage,
    };
  },

  computed: {
    challengeCountText(): string {
      if (this.course.challengeCount === undefined) return "";

      const count = this.course.challengeCount;

      if (this.effectiveLanguage === "sk") {
        if (count === 1) {
          return this.i18nStore.t("course.challengeCountSingular", { count });
        } else if (count >= 2 && count <= 4) {
          return this.i18nStore.t("course.challengeCountFew", { count });
        } else {
          return this.i18nStore.t("course.challengeCount", { count });
        }
      } else {
        if (count === 1) {
          return this.i18nStore.t("course.challengeCountSingular", { count });
        } else {
          return this.i18nStore.t("course.challengeCount", { count });
        }
      }
    },

    textColor(): string {
      if (!this.course.color) return "#ffffff";

      try {
        const color = new Color(this.course.color);
        // Calculate relative luminance using WCAG formula
        const luminance = color.luminance();

        // Use WCAG contrast ratio threshold (0.5 is a good middle point)
        // Lighter colors (luminance > 0.5) get dark text, darker colors get white text
        return luminance > 0.5 ? "#000000" : "#ffffff";
      } catch {
        // Fallback to white if color parsing fails
        return "#ffffff";
      }
    },
  },

  methods: {
    handleClick() {
      const path = this.i18nStore.getLocalizedPath(`/challenges/${this.course.slug}`);
      this.$router.push(path);
    },
  },
});
</script>

<template>
  <div
    class="rounded-lg p-6 cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg"
    :style="{ backgroundColor: course.color, color: textColor }"
    @click="handleClick"
  >
    <h3 class="text-2xl font-bold mb-2">{{ course.title }}</h3>
    <p v-if="course.challengeCount !== undefined" :style="{ opacity: 0.8 }">
      {{ challengeCountText }}
    </p>
  </div>
</template>
