<script lang="ts">
import { defineComponent } from "vue";
import { parseUrlPath } from "../utils";
import CoursePage from "./CoursePage.vue";
import ChallengePage from "./ChallengePage.vue";

export default defineComponent({
  name: "ChallengeDynamicPage",

  components: {
    CoursePage,
    ChallengePage,
  },

  computed: {
    pathMatch(): string {
      const match = this.$route.params.pathMatch;
      return Array.isArray(match) ? match.join("/") : match || "";
    },

    isChallenge(): boolean {
      const parsed = parseUrlPath(this.pathMatch);
      return parsed.isChallenge;
    },
  },
});
</script>

<template>
  <CoursePage v-if="!isChallenge" :key="`course-${pathMatch}`" />
  <ChallengePage v-else :key="`challenge-${pathMatch}`" />
</template>
