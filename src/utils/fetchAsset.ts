// detects 404s by checking for app-entry meta tag (dev/prod return HTML for missing files)

export interface FetchAssetOptions {
  expectedContentType?: string;
}

export interface FetchAssetResult {
  ok: boolean;
  response?: Response;
  text?: string;
}

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
    return { ok: true, response, text };
  } catch {
    return { ok: false };
  }
}

export async function fetchJsonAsset<T = any>(url: string): Promise<T | null> {
  const result = await fetchAsset(url, { expectedContentType: "application/json" });
  if (!result.ok || !result.text) return null;

  try {
    return JSON.parse(result.text) as T;
  } catch {
    return null;
  }
}

export async function fetchTextAsset(url: string, expectedContentType?: string): Promise<string | null> {
  const result = await fetchAsset(url, { expectedContentType });
  return result.ok && result.text ? result.text : null;
}
