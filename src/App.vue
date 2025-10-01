<script setup lang="ts">
import { RouterView } from "vue-router";
import { useI18nStore } from "./stores/i18n";

const i18nStore = useI18nStore();
i18nStore.initializeLanguage();
</script>

<template>
  <RouterView />
</template>
