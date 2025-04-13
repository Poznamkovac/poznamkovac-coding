export type LanguageCode = string;

// Keep "auto" as a special case for auto-detection
export type SystemLanguageCode = "auto";

export interface Translations {
  app: {
    title: string;
    welcome: string;
  };
  header: {
    back: string;
    home: string;
    language: string;
    auto: string;
  };
  common: {
    loading: string;
    error: string;
    noCategories: string;
  };
  categories: {
    web: {
      title: string;
    };
    python: {
      title: string;
    };
  };
}

export interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  isLoading: boolean;
}
