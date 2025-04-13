import { useState, useEffect } from "react";
import { useI18n } from "./useI18n";
import { fetchLocalizedResource } from "../services/i18nService";

/**
 * Hook for loading localized resources
 *
 * @param path The path to the resource
 * @returns Object containing the resource data, loading state, and error state
 */
export const useLocalizedResource = <T>(path: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language, t } = useI18n();

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchLocalizedResource<T>(path, language)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Error loading resource from ${path}:`, err);
        setError(t("common.error"));
        setLoading(false);
      });
  }, [path, language, t]);

  return { data, loading, error };
};
