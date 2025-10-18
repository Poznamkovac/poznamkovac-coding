<script lang="ts">
import { useI18n } from "vue-i18n";
import { defineComponent } from "vue";
import { getLocalizedPath } from "../i18n";
import { useLanguage } from "../composables/useLanguage";
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
    const { t } = useI18n();
    const effectiveLanguage = useLanguage();

    return {
      t,
      effectiveLanguage,
    };
  },

  computed: {
    challengeCountText(): string {
      if (this.course.challengeCount === undefined) return "";

      const count = this.course.challengeCount;

      if (this.effectiveLanguage === "sk") {
        if (count === 1) {
          return this.t("course.challengeCountSingular", { count });
        } else if (count >= 2 && count <= 4) {
          return this.t("course.challengeCountFew", { count });
        } else {
          return this.t("course.challengeCount", { count });
        }
      } else {
        if (count === 1) {
          return this.t("course.challengeCountSingular", { count });
        } else {
          return this.t("course.challengeCount", { count });
        }
      }
    },

    textColor(): string {
      if (!this.course.color) return "#ffffff";

      const color = new Color(this.course.color);
      const { r, g, b } = color.rgb;
      const luminance = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);

      return luminance > 0.5 ? "#000000" : "#ffffff";
    },
  },

  methods: {
    handleClick() {
      const path = getLocalizedPath(`/challenges/${this.course.slug}`);
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
    <h3 class="text-2xl font-bold mb-2">
      {{ course.title }}
    </h3>
    <p v-if="course.challengeCount !== undefined" :style="{ opacity: 0.8 }">
      {{ challengeCountText }}
    </p>
  </div>
</template>
