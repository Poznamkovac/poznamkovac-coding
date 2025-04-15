import React, { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { LanguageCode, Translations, I18nContextType } from "../types/i18n";

// Create the context with a default value
export const I18nContext = createContext<I18nContextType>({
  language: "auto",
  setLanguage: () => {},
  t: () => "",
  isLoading: true,
});

// Helper function to get a value from a nested object using a dot-separated path
const getNestedValue = (obj: Translations | Record<string, unknown>, path: string): string => {
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key as keyof typeof current] as Translations | Record<string, unknown>;
    } else {
      return path; // Return the key path if translation not found
    }
  }

  return String(current);
};

// Helper to get browser language
const getBrowserLanguage = (): LanguageCode => {
  const browserLang = navigator.language.split("-")[0];
  return browserLang === "sk" ? "sk" : "en"; // Default to 'en' for any language other than Slovak
};

// Default language when a requested language is not available
const DEFAULT_LANGUAGE = "en";

interface I18nProviderProps {
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get language preference from URL, localStorage, or browser
  const getInitialLanguage = (): LanguageCode => {
    // 1. Prioritize URL language parameter
    const urlLang = searchParams.get("lang");
    if (urlLang) {
      // Any language from URL is accepted
      return urlLang;
    }

    // 2. Use localStorage if no URL parameter
    const storedLang = localStorage.getItem("language");
    if (storedLang) {
      return storedLang;
    }

    // 3. Default to auto
    return "auto";
  };

  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage());

  // Effect to update URL when language changes
  useEffect(() => {
    // Since we're using HashRouter, we need to handle query params correctly
    // Get the current URL without the search params
    const url = new URL(window.location.href);

    // Build the new URL with the language parameter in the right place (before the hash)
    if (language !== "auto") {
      url.searchParams.set("lang", language);
    } else {
      url.searchParams.delete("lang");
    }

    // Update the URL without causing a navigation/reload
    const newUrl = `${url.origin}${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, "", newUrl);
  }, [language]);

  // Function to set language and save to localStorage
  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  }, []);

  // Get the effective language (resolves 'auto' to actual language)
  const effectiveLanguage = useMemo((): LanguageCode => {
    return language === "auto" ? getBrowserLanguage() : language;
  }, [language]);

  // Load translations
  useEffect(() => {
    setIsLoading(true);

    fetch(`/data/${effectiveLanguage}.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load translations: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setTranslations(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error loading translations:", error);
        setIsLoading(false);

        // Handle case when language file doesn't exist
        if (effectiveLanguage !== DEFAULT_LANGUAGE && effectiveLanguage !== "auto") {
          setLanguage(DEFAULT_LANGUAGE);
        }
      });
  }, [effectiveLanguage, setLanguage]);

  // Translation function
  const t = useCallback(
    (key: string): string => {
      if (!translations) return key;
      return getNestedValue(translations, key) || key;
    },
    [translations],
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isLoading,
    }),
    [language, setLanguage, t, isLoading],
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};
