import { LanguageCode } from "../types/i18n";

// Function to get browser language - helper that should be used only when language is "auto"
const getBrowserLanguage = (): string => {
  const browserLang = navigator.language.split("-")[0];
  return browserLang;
};

/**
 * Gets the effective language from the provided language code
 * If 'auto', returns the browser language (defaulting to 'en' if browser language is not supported)
 */
export const getEffectiveLanguage = (language: LanguageCode): string => {
  if (language === "auto") {
    return getBrowserLanguage();
  }
  return language;
};

/**
 * Gets the URL for a resource, adjusting for the language
 * For assignments and other content, it will return a language-specific path
 *
 * @param path The original path to the resource (e.g., "/data/categories.json")
 * @param language The language code
 * @returns The adjusted path with language prefix
 */
export const getLocalizedResourceUrl = (path: string, language: LanguageCode): string => {
  const effectiveLanguage = getEffectiveLanguage(language);

  // If the path starts with "/data/" and is not one of the translation files
  if (path.startsWith("/data/") && !path.match(/\/data\/(en|sk)\.json$/)) {
    // Insert the language code after "/data/"
    return path.replace("/data/", `/data/${effectiveLanguage}/`);
  }

  return path;
};

/**
 * Fetches a resource with language-specific path adjustment
 *
 * @param path The path to the resource
 * @param language The language code
 * @returns A promise resolving to the parsed JSON response
 */
export const fetchLocalizedResource = async <T>(path: string, language: LanguageCode): Promise<T> => {
  const localizedUrl = getLocalizedResourceUrl(path, language);

  try {
    const response = await fetch(localizedUrl);

    if (!response.ok) {
      // If language-specific resource doesn't exist, try falling back to English
      if (getEffectiveLanguage(language) !== "en") {
        const englishUrl = getLocalizedResourceUrl(path, "en");
        const englishResponse = await fetch(englishUrl);

        if (englishResponse.ok) {
          return englishResponse.json();
        }
      }

      // If still not found, try the original path without language prefix
      const originalResponse = await fetch(path);

      if (originalResponse.ok) {
        return originalResponse.json();
      }

      throw new Error(`Failed to load resource: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error fetching localized resource: ${localizedUrl}`, error);
    throw error;
  }
};
