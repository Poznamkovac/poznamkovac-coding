/**
 * Fetch helper for static assets that properly detects 404s
 *
 * Both dev server (Vite) and production (GitHub Pages) return index.html or 404.html
 * for missing files instead of proper 404 status codes. This helper detects the
 * app entry marker to determine if a response is actually the fallback HTML.
 */

export interface FetchAssetOptions {
  /**
   * Expected content type (e.g., 'application/json', 'text/plain')
   * If provided, will check the Content-Type header
   */
  expectedContentType?: string;
}

export interface FetchAssetResult {
  /**
   * Whether the asset exists (not a 404 fallback)
   */
  ok: boolean;

  /**
   * The response object (only if ok is true)
   */
  response?: Response;

  /**
   * The text content (only if ok is true)
   */
  text?: string;
}

/**
 * Fetch a static asset with proper 404 detection
 *
 * @param url - The URL to fetch
 * @param options - Optional fetch options
 * @returns FetchAssetResult indicating whether the asset exists and containing the response/text
 *
 * @example
 * const result = await fetchAsset('/data/course/challenge/metadata.json');
 * if (result.ok) {
 *   const data = JSON.parse(result.text!);
 * }
 */
export async function fetchAsset(url: string, options?: FetchAssetOptions): Promise<FetchAssetResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { ok: false };
    }
    if (options?.expectedContentType) {
      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.includes(options.expectedContentType)) {
        return { ok: false };
      }
    }
    const text = await response.text();
    if (text.includes('<meta name="app-entry" content="true"')) {
      return { ok: false };
    }
    const trimmedText = text.trim().toLowerCase();
    if (trimmedText.startsWith("<!doctype html>") || trimmedText.startsWith("<html")) {
      const hasHtmlStructure = trimmedText.includes("<head>") && trimmedText.includes("<body>");
      if (hasHtmlStructure) {
        return { ok: false };
      }
    }
    return {
      ok: true,
      response,
      text,
    };
  } catch (error) {
    return { ok: false };
  }
}

/**
 * Fetch a JSON asset with proper 404 detection
 *
 * @param url - The URL to fetch
 * @returns The parsed JSON object or null if not found
 */
export async function fetchJsonAsset<T = any>(url: string): Promise<T | null> {
  const result = await fetchAsset(url, { expectedContentType: "application/json" });

  if (!result.ok || !result.text) {
    return null;
  }

  try {
    return JSON.parse(result.text) as T;
  } catch {
    return null;
  }
}

/**
 * Fetch a text asset with proper 404 detection
 *
 * @param url - The URL to fetch
 * @param expectedContentType - Optional expected content type (e.g., 'text/plain')
 * @returns The text content or null if not found
 */
export async function fetchTextAsset(url: string, expectedContentType?: string): Promise<string | null> {
  const result = await fetchAsset(url, { expectedContentType });
  return result.ok && result.text ? result.text : null;
}
