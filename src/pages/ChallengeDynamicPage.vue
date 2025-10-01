<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { parseUrlPath } from "../utils";
import CoursePage from "./CoursePage.vue";
import ChallengePage from "./ChallengePage.vue";

const route = useRoute();

const pathMatch = computed(() => {
  const match = route.params.pathMatch;
  return Array.isArray(match) ? match.join("/") : match || "";
});

const { isChallenge } = computed(() => parseUrlPath(pathMatch.value)).value;
</script>

<template>
  <CoursePage v-if="!isChallenge" />
  <ChallengePage v-else />
</template>
