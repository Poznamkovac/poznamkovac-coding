import { I18nContext } from "../contexts/I18nContext";
import { useContext } from "react";
import { getLocalizedResourceUrl } from "./i18nService";

/**
 * Shorthand for useContext(I18nContext) to get the translation function
 * Use this when you only need the translation function (t)
 *
 * Example:
 * import { useTranslation } from '../services/i18nUtils';
 *
 * function MyComponent() {
 *   const { t } = useTranslation();
 *   return <div>{t('key')}</div>;
 * }
 */
export const useTranslation = () => {
  const context = useContext(I18nContext);

  if (context === undefined) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }

  const { t, language } = context;

  return {
    t,
    language,
    localizeUrl: (path: string) => getLocalizedResourceUrl(path, language),
  };
};

/**
 * Hook that provides only the translation function
 * Even shorter than useTranslation() when you only need the `t` function
 *
 * Example:
 * import { useT } from '../services/i18nUtils';
 *
 * function MyComponent() {
 *   const t = useT();
 *   return <div>{t('key')}</div>;
 * }
 */
export const useT = () => {
  const { t } = useTranslation();
  return t;
};
