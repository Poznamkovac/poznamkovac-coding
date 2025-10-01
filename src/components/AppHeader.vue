<script setup lang="ts">
import { useI18n } from "../composables/useI18n";
import { useI18nStore } from "../stores/i18n";
import { useRouter, useRoute } from "vue-router";

const { t, language, setLanguage } = useI18n();
const i18nStore = useI18nStore();
const router = useRouter();
const route = useRoute();

const handleLanguageChange = (lang: "sk" | "en") => {
  const currentPath = route.path;

  // Extract language from current path
  const pathLang = i18nStore.extractLanguageFromPath(currentPath);

  setLanguage(lang);

  // If we're on a challenges page, try to navigate to the same page in the new language
  if (currentPath.includes("/challenges/")) {
    let newPath = currentPath;

    // Remove old language prefix if exists
    if (pathLang) {
      newPath = currentPath.replace(new RegExp(`^/${pathLang}/`), "/");
    }

    // Add new language prefix
    if (newPath.startsWith("/challenges/")) {
      newPath = `/${lang}${newPath}`;
    }

    router.push(newPath);
  }
};

const goHome = () => {
  router.push("/");
};
</script>

<template>
  <header class="bg-[#1a1a1a] border-b border-gray-800">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4 cursor-pointer" @click="goHome">
        <img src="https://poznamkovac.eu/resources/assets/logo.svg" alt="Logo" class="h-8 w-8" />
        <h1 class="text-xl font-bold text-white">{{ t("app.title") }}</h1>
      </div>

      <div class="flex items-center gap-2">
        <button
          :class="[
            'px-3 py-1 rounded text-sm transition',
            language === 'sk' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
          @click="handleLanguageChange('sk')"
        >
          SK
        </button>
        <button
          :class="[
            'px-3 py-1 rounded text-sm transition',
            language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
          @click="handleLanguageChange('en')"
        >
          EN
        </button>
      </div>
    </div>
  </header>
</template>
