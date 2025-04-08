import { useSearchParams } from "react-router-dom";

export interface EmbedOptions {
  autoReload: boolean;
  showAssignment: boolean;
  isScored: boolean;
  showEditors: boolean;
}

export const DEFAULT_OPTIONS: EmbedOptions = {
  autoReload: true,
  showAssignment: true,
  isScored: true,
  showEditors: true,
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

export function useQueryParams(): {
  options: EmbedOptions;
  customData: CustomData | null;
  parseError: string | null;
} {
  const [searchParams] = useSearchParams();

  // Parse display options
  const options: EmbedOptions = {
    autoReload: searchParams.get("autoReload") !== "false",
    showAssignment: searchParams.get("showAssignment") !== "false",
    isScored: searchParams.get("isScored") !== "false",
    showEditors: searchParams.get("showEditors") !== "false",
  };

  // Parse custom data (if any)
  let customData = null;
  let parseError = null;
  const dataParam = searchParams.get("data");

  if (dataParam) {
    try {
      // Decode URL component and convert URL-safe base64 to standard base64
      const fixedBase64 = fromUrlSafeBase64(decodeURIComponent(dataParam));
      const decodedData = atob(fixedBase64);
      customData = JSON.parse(decodedData);
    } catch (error) {
      console.error("Failed to parse custom data", error);
      parseError = `Failed to parse custom data: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  return { options, customData, parseError };
}
