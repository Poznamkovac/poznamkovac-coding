export interface EmbedOptions {
  autoReload: boolean;
  showAssignment: boolean;
  isScored: boolean;
  showEditors: boolean;
  showPreview: boolean;
  theme: "light" | "dark";
}

export const DEFAULT_OPTIONS: EmbedOptions = {
  autoReload: true,
  showAssignment: true,
  isScored: true,
  showEditors: true,
  showPreview: true,
  theme: "dark",
};

// Custom data can contain arbitrary JSON data
export type CustomData = Record<string, unknown>;

// Convert standard base64 to URL-safe base64
export const toUrlSafeBase64 = (base64: string): string => {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// Convert URL-safe base64 back to standard base64
export const fromUrlSafeBase64 = (safe: string): string => {
  // Add padding if needed
  let base64 = safe.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }
  return base64;
};

// Convert base64 to UTF-8 string (handles non-ASCII characters)
export const base64ToUtf8 = (base64: string): string => {
  return decodeURIComponent(window.atob(base64));
};

export function useQueryParams(): {
  options: EmbedOptions;
  customData: CustomData | null;
  parseError: string | null;
} {
  // Get search params directly from the URL rather than using useSearchParams
  // since we're now keeping params before the hash
  const urlSearchParams = new URLSearchParams(window.location.search);

  // Parse display options
  const options: EmbedOptions = {
    autoReload: urlSearchParams.get("autoReload") !== "false",
    showAssignment: urlSearchParams.get("showAssignment") !== "false",
    isScored: urlSearchParams.get("isScored") !== "false",
    showEditors: urlSearchParams.get("showEditors") !== "false",
    showPreview: urlSearchParams.get("showPreview") !== "false",
    theme: urlSearchParams.get("theme") === "light" ? "light" : "dark",
  };

  // Parse custom data (if any)
  let customData = null;
  let parseError = null;
  const dataParam = urlSearchParams.get("data");

  if (dataParam) {
    try {
      // Decode URL component and convert URL-safe base64 to standard base64
      const fixedBase64 = fromUrlSafeBase64(decodeURIComponent(dataParam));
      const decodedData = base64ToUtf8(fixedBase64); // Use UTF-8 safe decoding
      customData = JSON.parse(decodedData);
    } catch (error) {
      console.error("Failed to parse custom data", error);
      parseError = `Failed to parse custom data: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  return { options, customData, parseError };
}
