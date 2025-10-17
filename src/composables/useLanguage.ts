import { computed, type WritableComputedRef } from "vue";
import type { LanguageCode } from "../types";

export function useLanguage(): WritableComputedRef<LanguageCode> {
  return computed<LanguageCode>({
    get: () => (localStorage.getItem("language") as LanguageCode | null) || "auto",
    set: (value: LanguageCode) => localStorage.setItem("language", value),
  });
}
