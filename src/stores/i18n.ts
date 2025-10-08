import { defineStore } from "pinia";
import { computed } from "vue";
import type { LanguageCode } from "../types";
import {
  setLanguage as i18nSetLanguage,
  getEffectiveLanguage,
  getLocalizedUrl as i18nGetLocalizedUrl,
  getLocalizedPath as i18nGetLocalizedPath,
  extractLanguageFromPath as i18nExtractLanguageFromPath,
} from "../i18n";

// This store is now just a thin wrapper around vue-i18n
// Kept for backwards compatibility and to centralize language logic
export const useI18nStore = defineStore("i18n", () => {
  const effectiveLanguage = computed(() => getEffectiveLanguage());

  const language = computed<LanguageCode>({
    get() {
      const stored = localStorage.getItem("language") as LanguageCode | null;
      return stored || "auto";
    },
    set(value: LanguageCode) {
      localStorage.setItem("language", value);
    },
  });

  function initializeLanguage() {
    // Language is already initialized in i18n.ts
    // This is kept for backwards compatibility
  }

  function setLanguage(newLang: LanguageCode) {
    i18nSetLanguage(newLang);
  }

  function getLocalizedUrl(url: string): string {
    return i18nGetLocalizedUrl(url);
  }

  function getLocalizedPath(path: string): string {
    return i18nGetLocalizedPath(path);
  }

  function extractLanguageFromPath(path: string): "sk" | "en" | null {
    return i18nExtractLanguageFromPath(path);
  }

  return {
    language,
    effectiveLanguage,
    initializeLanguage,
    setLanguage,
    getLocalizedUrl,
    getLocalizedPath,
    extractLanguageFromPath,
  };
});
