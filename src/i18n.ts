import { createI18n } from "vue-i18n";
import type { LanguageCode } from "./types";

import sk from "./locales/sk.json";
import en from "./locales/en.json";

function detectBrowserLanguage(): "sk" | "en" {
  return navigator.language.toLowerCase().startsWith("sk") ? "sk" : "en";
}

function getInitialLocale(): "sk" | "en" {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get("lang") as LanguageCode | null;
  const storedLang = localStorage.getItem("language") as LanguageCode | null;

  if (urlLang && ["sk", "en"].includes(urlLang)) {
    localStorage.setItem("language", urlLang);
    return urlLang as "sk" | "en";
  }

  if (storedLang && ["sk", "en", "auto"].includes(storedLang)) {
    return storedLang === "auto" ? detectBrowserLanguage() : (storedLang as "sk" | "en");
  }

  return detectBrowserLanguage();
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: "en",
  messages: {
    sk,
    en,
  },
});

export function getEffectiveLanguage(): "sk" | "en" {
  return i18n.global.locale.value as "sk" | "en";
}

export function setLanguage(lang: LanguageCode) {
  const effectiveLang = lang === "auto" ? detectBrowserLanguage() : lang;
  i18n.global.locale.value = effectiveLang;
  localStorage.setItem("language", lang);
}

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

export function getLocalizedPath(path: string): string {
  const lang = getEffectiveLanguage();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const cleanPath = normalizedPath.replace(/^\/+/, "");

  if (cleanPath.match(/^(sk|en)\//)) {
    return `/${lang}/${cleanPath.replace(/^(sk|en)\//, "")}`;
  }

  return cleanPath.startsWith("challenges/") ? `/${lang}/${cleanPath}` : normalizedPath;
}

export function extractLanguageFromPath(path: string): "sk" | "en" | null {
  const match = path.match(/^\/(sk|en)\//);
  return match ? (match[1] as "sk" | "en") : null;
}
