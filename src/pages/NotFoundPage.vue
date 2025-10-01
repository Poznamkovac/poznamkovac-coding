<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import { useI18n } from "../composables/useI18n";

const route = useRoute();
const router = useRouter();
const { t, effectiveLanguage } = useI18n();

const pathSegments = computed(() => {
  const path = route.path.replace(/^\/+|\/+$/g, "");
  return path.split("/").filter(Boolean);
});

const parentPath = computed(() => {
  if (pathSegments.value.length <= 1) {
    return "/";
  }
  const segments = [...pathSegments.value];
  segments.pop();
  return "/" + segments.join("/");
});

const isTranslationMissing = computed(() => {
  return pathSegments.value.length > 0 && 
         (pathSegments.value[0] === "sk" || pathSegments.value[0] === "en") &&
         pathSegments.value[0] !== effectiveLanguage.value;
});

const goBack = () => {
  router.push(parentPath.value);
};

const goHome = () => {
  router.push("/");
};
</script>

<template>
  <DefaultLayout>
    <div class="container mx-auto px-4 py-16 text-center">
      <div class="max-w-2xl mx-auto">
        <h1 class="text-6xl font-bold text-white mb-4">404</h1>
        
        <div v-if="isTranslationMissing" class="mb-8">
          <p class="text-xl text-gray-300 mb-4">
            {{ t("challenge.notAvailableInLanguage") }}
          </p>
          <p class="text-gray-400">
            This content is not available in {{ effectiveLanguage === "sk" ? "Slovak" : "English" }}.
          </p>
        </div>
        
        <div v-else class="mb-8">
          <p class="text-xl text-gray-300 mb-4">
            {{ t("common.notFound") }}
          </p>
          <p class="text-gray-400">
            The page you're looking for doesn't exist.
          </p>
        </div>

        <div class="flex gap-4 justify-center">
          <button
            v-if="parentPath !== '/'"
            @click="goBack"
            class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            {{ t("challenge.goBack", { path: parentPath }) }}
          </button>
          <button
            @click="goHome"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
          >
            {{ t("home.courses") }}
          </button>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>
