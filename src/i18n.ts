import { createI18n } from "vue-i18n";
import type { LanguageCode } from "./types";

// Import translation files
import sk from "./locales/sk.json";
import en from "./locales/en.json";

// Determine initial locale
function getInitialLocale(): "sk" | "en" {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get("lang") as LanguageCode | null;
  const storedLang = localStorage.getItem("language") as LanguageCode | null;

  if (urlLang && ["sk", "en"].includes(urlLang)) {
    localStorage.setItem("language", urlLang);
    return urlLang as "sk" | "en";
  }

  if (storedLang && ["sk", "en", "auto"].includes(storedLang)) {
    if (storedLang === "auto") {
      const browserLang = navigator.language.toLowerCase();
      return browserLang.startsWith("sk") ? "sk" : "en";
    }
    return storedLang as "sk" | "en";
  }

  // Default: auto-detect from browser
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith("sk") ? "sk" : "en";
}

export const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: getInitialLocale(),
  fallbackLocale: "en",
  messages: {
    sk,
    en,
  },
});

// Helper to get effective language (for data paths)
export function getEffectiveLanguage(): "sk" | "en" {
  return i18n.global.locale.value as "sk" | "en";
}

// Helper to set language
export function setLanguage(lang: LanguageCode) {
  const effectiveLang = lang === "auto" ? (navigator.language.toLowerCase().startsWith("sk") ? "sk" : "en") : lang;

  i18n.global.locale.value = effectiveLang;
  localStorage.setItem("language", lang);
}

// Helper to get localized URL
export function getLocalizedUrl(url: string): string {
  const lang = getEffectiveLanguage();

  if (url.startsWith("/data/categories.json")) {
    return `/data/${lang}/categories.json`;
  }

  if (url.startsWith("/data/challenges/")) {
    return url.replace("/data/challenges/", `/data/${lang}/challenges/`);
  }

  return url;
}

// Helper to get localized path
export function getLocalizedPath(path: string): string {
  const lang = getEffectiveLanguage();

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

// Helper to extract language from path
export function extractLanguageFromPath(path: string): "sk" | "en" | null {
  const match = path.match(/^\/(sk|en)\//);
  return match ? (match[1] as "sk" | "en") : null;
}
