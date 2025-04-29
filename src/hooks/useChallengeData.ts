import type { ChallengeData, VirtualFileSystem } from "../types/challenge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createVirtualFileSystem } from "../services/virtualFileSystemService";
import { useI18n } from "../hooks/useI18n";
import { getCategoryResourcePath } from "../services/i18nService";

// Helper function to extract the root category (first part before any slash)
export const getRootCategory = (fullCategoryPath: string): string => {
  return fullCategoryPath.split("/")[0];
};

export const useChallengeData = (categoryId: string, challengeId: string) => {
  const navigate = useNavigate();
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [fileSystem, setFileSystem] = useState<VirtualFileSystem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useI18n();

  useEffect(() => {
    // Load challenge data
    const loadChallengeData = async () => {
      setIsLoading(true);
      try {
        // Use the category path with the challenge ID
        const url = getCategoryResourcePath(categoryId, `${challengeId}/assignment.json`, language);
        const response = await fetch(url);
        const data: ChallengeData = await response.json();

        if (data.showPreview === undefined) {
          data.showPreview = true; // Default to true if not specified
        }

        if (!data.mainFile) {
          // Default to index.html or first file if not specified
          data.mainFile = data.files.find((f) => f.filename === "index.html")
            ? "index.html"
            : data.files.length > 0
            ? data.files[0].filename
            : "";
        }

        // If no previewTemplatePath is specified, see if one exists at the category level
        if (!data.previewTemplatePath) {
          try {
            // Extract the root category for previewTemplate.js
            const rootCategory = getRootCategory(categoryId);

            // Check if a previewTemplate.js exists for the ROOT category in the new location
            const templateUrl = `/data/previewTemplates/${rootCategory}.js`;
            const templateResponse = await fetch(templateUrl, { method: "HEAD" });
            if (templateResponse.ok) {
              data.previewTemplatePath = templateUrl;
            }
          } catch {
            // Ignore errors - we'll just not use a custom template
            console.log(`No preview template found for category ${categoryId}`);
          }
        }

        // Default autoreload property
        data.files.forEach((file) => {
          if (file.autoreload === undefined) {
            file.autoreload = true; // Default to true for backward compatibility
          }
        });

        setChallengeData(data);

        // Create virtual file system
        const fs = await createVirtualFileSystem(categoryId, challengeId, data.files, language);
        setFileSystem(fs);

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading challenge data:", error);
        navigate(`/challenges/${categoryId}`);
      }
    };

    loadChallengeData();
  }, [categoryId, challengeId, navigate, language]);

  return {
    challengeData,
    fileSystem,
    isLoading,
  };
};
