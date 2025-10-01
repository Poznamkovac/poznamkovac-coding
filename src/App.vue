<script lang="ts">
import { defineComponent } from "vue";
import { useI18nStore } from "./stores/i18n";

export default defineComponent({
  name: "App",

  created() {
    const i18nStore = useI18nStore();
    i18nStore.initializeLanguage();
  },
});
</script>

<template>
  <RouterView />
</template>
