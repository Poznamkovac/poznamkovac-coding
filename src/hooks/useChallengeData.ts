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
    // Handle legacy code format for backward compatibility
    const processLegacyCode = (data: ChallengeData) => {
      if (!data.pociatocnyKod) return data;

      const files: ChallengeData["files"] = [];

      // Convert HTML file
      if (data.pociatocnyKod.html) {
        let content = "";
        let readonly = false;

        if (Array.isArray(data.pociatocnyKod.html)) {
          content = data.pociatocnyKod.html[0] || "";
          readonly = data.pociatocnyKod.html.length > 1 ? !!data.pociatocnyKod.html[1] : false;
        } else {
          content = data.pociatocnyKod.html;
        }

        files.push({
          filename: "index.html",
          readonly,
          hidden: false,
          autoreload: true,
          content,
        });
      }

      // Convert CSS file
      if (data.pociatocnyKod.css) {
        let content = "";
        let readonly = false;

        if (Array.isArray(data.pociatocnyKod.css)) {
          content = data.pociatocnyKod.css[0] || "";
          readonly = data.pociatocnyKod.css.length > 1 ? !!data.pociatocnyKod.css[1] : false;
        } else {
          content = data.pociatocnyKod.css;
        }

        files.push({
          filename: "style.css",
          readonly,
          hidden: false,
          autoreload: true,
          content,
        });
      }

      // Convert JS file
      if (data.pociatocnyKod.js) {
        let content = "";
        let readonly = false;

        if (Array.isArray(data.pociatocnyKod.js)) {
          content = data.pociatocnyKod.js[0] || "";
          readonly = data.pociatocnyKod.js.length > 1 ? !!data.pociatocnyKod.js[1] : false;
        } else {
          content = data.pociatocnyKod.js;
        }

        files.push({
          filename: "script.js",
          readonly,
          hidden: false,
          autoreload: true,
          content,
        });
      }

      return {
        ...data,
        files,
        previewType: "html",
        mainFile: "index.html",
      };
    };

    // Load challenge data
    const loadChallengeData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/data/challenges/${categoryId}/${challengeId}/assignment.json`);
        let data: ChallengeData = await response.json();

        // Handle legacy format if needed
        if (!data.files || data.files.length === 0) {
          data = processLegacyCode(data);
        }

        // Set defaults if properties are missing
        if (!data.previewType) {
          data.previewType = "html";
        }

        if (!data.mainFile) {
          // Default to index.html or first file if not specified
          data.mainFile = data.files.find((f) => f.filename === "index.html")
            ? "index.html"
            : data.files.length > 0
            ? data.files[0].filename
            : "";
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
