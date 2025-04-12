import type { ChallengeData, VirtualFileSystem } from "../types/challenge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createVirtualFileSystem } from "../services/virtualFileSystemService";

export const useChallengeData = (categoryId: string, challengeId: string) => {
  const navigate = useNavigate();
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [fileSystem, setFileSystem] = useState<VirtualFileSystem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load challenge data
    const loadChallengeData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/data/challenges/${categoryId}/${challengeId}/assignment.json`);
        const data: ChallengeData = await response.json();

        // Set defaults if properties are missing
        if (!data.previewType) {
          data.previewType = "html";
        }

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
            // Check if a previewTemplate.js exists for this category
            const templateResponse = await fetch(`/data/challenges/${categoryId}/previewTemplate.js`, { method: "HEAD" });
            if (templateResponse.ok) {
              data.previewTemplatePath = `/data/challenges/${categoryId}/previewTemplate.js`;
            }
          } catch (error) {
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
        const fs = await createVirtualFileSystem(categoryId, challengeId, data.files);
        setFileSystem(fs);

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading challenge data:", error);
        navigate(`/challenges/${categoryId}`);
      }
    };

    loadChallengeData();
  }, [categoryId, challengeId, navigate]);

  return {
    challengeData,
    fileSystem,
    isLoading,
  };
};
