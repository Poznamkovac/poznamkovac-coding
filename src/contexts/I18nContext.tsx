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
      current = current[key as keyof typeof current];
    } else {
      return path; // Return the key path if translation not found
    }
  }

  return current as string;
};

// Helper to get browser language
const getBrowserLanguage = (): LanguageCode => {
  const browserLang = navigator.language.split("-")[0];
  return browserLang === "sk" ? "sk" : "en"; // Default to 'en' for any language other than Slovak
};

interface I18nProviderProps {
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get language preference from URL, localStorage, or browser
  const getInitialLanguage = (): LanguageCode => {
    const urlLang = searchParams.get("lang") as LanguageCode | null;
    if (urlLang && (urlLang === "en" || urlLang === "sk" || urlLang === "auto")) {
      return urlLang;
    }

    const storedLang = localStorage.getItem("language") as LanguageCode | null;
    if (storedLang && (storedLang === "en" || storedLang === "sk" || storedLang === "auto")) {
      return storedLang;
    }

    return "auto";
  };

  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage());

  // Effect to update URL when language changes
  useEffect(() => {
    if (language !== "auto") {
      searchParams.set("lang", language);
    } else {
      searchParams.delete("lang");
    }
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}${window.location.hash}`
    );
  }, [language, searchParams]);

  // Function to set language and save to localStorage
  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  }, []);

  // Get the effective language (resolves 'auto' to actual language)
  const effectiveLanguage = useMemo((): "en" | "sk" => {
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
      });
  }, [effectiveLanguage]);

  // Translation function
  const t = useCallback(
    (key: string): string => {
      if (!translations) return key;
      return getNestedValue(translations, key) || key;
    },
    [translations]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isLoading,
    }),
    [language, setLanguage, t, isLoading]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};
