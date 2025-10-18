<script lang="ts">
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";
import { setLanguage, extractLanguageFromPath } from "../i18n";
import { useLanguage } from "../composables/useLanguage";

export default defineComponent({
  name: "AppHeader",

  setup() {
    const { t } = useI18n();
    const language = useLanguage();

    return {
      t,
      language,
    };
  },

  methods: {
    handleLanguageChange(lang: "sk" | "en") {
      const currentPath = this.$route.path;
      const pathLang = extractLanguageFromPath(currentPath);

      setLanguage(lang);

      if (currentPath.includes("/challenges/")) {
        let newPath = currentPath;

        if (pathLang) {
          newPath = currentPath.replace(new RegExp(`^/${pathLang}/`), "/");
        }

        if (newPath.startsWith("/challenges/")) {
          newPath = `/${lang}${newPath}`;
        }

        this.$router.push(newPath);
      }
    },

    goHome() {
      this.$router.push("/");
    },
  },
});
</script>

<template>
  <header class="bg-[#1a1a1a] border-b border-gray-800">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4 cursor-pointer" @click="goHome">
        <img src="https://poznamkovac.eu/resources/assets/logo.svg" alt="Logo" class="h-8 w-8" />
        <h1 class="text-xl font-bold text-white">
          {{ t("app.title") }}
        </h1>
      </div>

      <div class="flex items-center gap-2">
        <button
          :class="[
            'px-3 py-1 rounded text-sm transition',
            language === 'sk' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
          ]"
          @click="handleLanguageChange('sk')"
        >
          SK
        </button>
        <button
          :class="[
            'px-3 py-1 rounded text-sm transition',
            language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
          ]"
          @click="handleLanguageChange('en')"
        >
          EN
        </button>
      </div>
    </div>
  </header>
</template>
