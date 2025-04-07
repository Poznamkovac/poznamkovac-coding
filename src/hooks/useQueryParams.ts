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

export function useQueryParams(): {
  options: EmbedOptions;
  customData: any | null;
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
  const dataParam = searchParams.get("data");

  if (dataParam) {
    try {
      const decodedData = atob(dataParam);
      customData = JSON.parse(decodedData);
    } catch (error) {
      console.error("Failed to parse custom data", error);
    }
  }

  return { options, customData };
}
