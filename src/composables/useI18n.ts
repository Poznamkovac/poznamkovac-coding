import { storeToRefs } from "pinia";
import { useI18nStore } from "../stores/i18n";

export function useI18n() {
  const i18nStore = useI18nStore();
  const { language, effectiveLanguage, isLoading } = storeToRefs(i18nStore);
  const { setLanguage, t, getLocalizedUrl } = i18nStore;

  return {
    language,
    effectiveLanguage,
    isLoading,
    setLanguage,
    t,
    getLocalizedUrl,
  };
}
