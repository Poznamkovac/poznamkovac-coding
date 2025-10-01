import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { LanguageCode } from "../types";

export const useI18nStore = defineStore("i18n", () => {
  const language = ref<LanguageCode>("auto");
  const translations = ref<Record<string, string>>({});
  const isLoading = ref(false);

  const effectiveLanguage = computed((): "sk" | "en" => {
    if (language.value === "auto") {
      const browserLang = navigator.language.toLowerCase();
      return browserLang.startsWith("sk") ? "sk" : "en";
    }
    return language.value;
  });

  function initializeLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get("lang") as LanguageCode | null;
    const storedLang = localStorage.getItem("language") as LanguageCode | null;

    if (urlLang && ["sk", "en", "auto"].includes(urlLang)) {
      language.value = urlLang;
      localStorage.setItem("language", urlLang);
    } else if (storedLang && ["sk", "en", "auto"].includes(storedLang)) {
      language.value = storedLang;
    }

    loadTranslations();
  }

  async function loadTranslations() {
    isLoading.value = true;
    try {
      const lang = effectiveLanguage.value;
      const response = await fetch(`/data/${lang}.json`);
      const data = await response.json();
      translations.value = data;
    } catch (error) {
      console.error("Failed to load translations:", error);
    } finally {
      isLoading.value = false;
    }
  }

  function setLanguage(newLang: LanguageCode) {
    language.value = newLang;
    localStorage.setItem("language", newLang);
    loadTranslations();
  }

  function t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split(".");
    let value: any = translations.value;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value !== "string") {
      return key;
    }

    if (!params) {
      return value;
    }

    return Object.entries(params).reduce((result, [paramKey, paramValue]) => {
      return result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue));
    }, value);
  }

  function getLocalizedUrl(url: string): string {
    const lang = effectiveLanguage.value;

    if (url.startsWith("/data/categories.json")) {
      return `/data/${lang}/categories.json`;
    }

    if (url.startsWith("/data/challenges/")) {
      return url.replace("/data/challenges/", `/data/${lang}/challenges/`);
    }

    return url;
  }

  function getLocalizedPath(path: string): string {
    const lang = effectiveLanguage.value;

    // Ensure path has leading slash
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    // Remove leading slash for matching
    const cleanPath = normalizedPath.replace(/^\/+/, "");

    // If path already starts with a language code, replace it
    if (cleanPath.match(/^(sk|en)\//)) {
      return `/${lang}/${cleanPath.replace(/^(sk|en)\//, "")}`;
    }

    // Add language prefix to challenges paths
    if (cleanPath.startsWith("challenges/")) {
      return `/${lang}/${cleanPath}`;
    }

    // Return normalized path (with leading slash)
    return normalizedPath;
  }

  function extractLanguageFromPath(path: string): "sk" | "en" | null {
    const match = path.match(/^\/(sk|en)\//);
    return match ? (match[1] as "sk" | "en") : null;
  }

  return {
    language,
    effectiveLanguage,
    translations,
    isLoading,
    initializeLanguage,
    setLanguage,
    t,
    getLocalizedUrl,
    getLocalizedPath,
    extractLanguageFromPath,
  };
});
