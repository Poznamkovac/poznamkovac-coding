import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import ChallengeIDE from "../components/ChallengeIDE";
import ChallengePreview from "../components/ChallengePreview";
import ChallengeTests from "../components/ChallengeTests";
import { useChallengeData } from "../hooks/useChallengeData";
import { useQueryParams } from "../hooks/useQueryParams";
import { storageService } from "../services/storageService";
import { FILE_CHANGE_EVENT, FileChangeEvent } from "../services/virtualFileSystemService";
import EmbedLayout from "../components/EmbedLayout";
import { useI18n } from "../hooks/useI18n";
import { getCategoryResourcePath } from "../services/i18nService";

const EmbedChallengePage: React.FC = () => {
  const location = useLocation();
  const { options } = useQueryParams();
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [isScoreLoading, setIsScoreLoading] = useState(true);
  const [needsTestRun, setNeedsTestRun] = useState(false);
  const previewApiRef = useRef<{ forceReload: () => Promise<void> } | null>(null);
  const { language, t } = useI18n();

  // Extract path parts from the location
  const pathParts = useMemo(() => {
    // Remove /embed/ from the beginning of the path
    const path = location.pathname.replace(/^\/embed\//, "");
    return path.split("/").filter((part) => part !== "");
  }, [location.pathname]);

  // The last part is the challenge ID - ensure we're not including query params
  const challengeId = useMemo(() => {
    if (pathParts.length === 0) return "";

    const lastPart = pathParts[pathParts.length - 1];
    // Extract just the ID part in case there are query parameters
    return lastPart;
  }, [pathParts]);

  // Everything before the challenge ID is the category path
  const categoryPath = useMemo(() => {
    if (pathParts.length <= 1) return "";
    // Remove the challenge ID from the path parts
    return pathParts.slice(0, pathParts.length - 1).join("/");
  }, [pathParts]);

  // Get the root category for previewTemplate.js
  const rootCategory = useMemo(() => {
    if (pathParts.length <= 1) return "";
    return pathParts[0]; // First part is the root category
  }, [pathParts]);

  const { challengeData, fileSystem, isLoading } = useChallengeData(categoryPath, challengeId);

  useEffect(() => {
    if (challengeData) {
      const loadScore = async () => {
        setIsScoreLoading(true);
        const score = await storageService.getChallengeScore(categoryPath, challengeId, language);
        setCurrentScore(score);
        setIsScoreLoading(false);
      };

      loadScore();

      // Set up event listener for score updates
      const handleScoreUpdate = (event: Event) => {
        const customEvent = event as CustomEvent<{ categoryId: string; challengeId: string; score: number; language?: string }>;
        const {
          categoryId: updatedCategoryId,
          challengeId: updatedChallengeId,
          score,
          language: eventLanguage,
        } = customEvent.detail;

        if (
          updatedCategoryId === categoryPath &&
          updatedChallengeId === challengeId &&
          (!eventLanguage || eventLanguage === language)
        ) {
          setCurrentScore(score);
        }
      };

      // Listen for file changes that require test runs
      const handleFileChange = (event: Event) => {
        const { shouldReload } = (event as CustomEvent<FileChangeEvent>).detail;

        if (!shouldReload && !options.autoReload) {
          // If the file doesn't auto-reload, the user should run tests
          setNeedsTestRun(true);
        }
      };

      // Add event listeners
      window.addEventListener("scoreUpdate", handleScoreUpdate);
      window.addEventListener(FILE_CHANGE_EVENT, handleFileChange);

      // Cleanup
      return () => {
        window.removeEventListener("scoreUpdate", handleScoreUpdate);
        window.removeEventListener(FILE_CHANGE_EVENT, handleFileChange);
      };
    }
  }, [challengeData, categoryPath, challengeId, options.autoReload, language]);

  const handleTestRun = () => {
    setNeedsTestRun(false);
  };

  const handleIframeLoad = useCallback((api: { forceReload: () => Promise<void> }) => {
    previewApiRef.current = api;
  }, []);

  // Function to force reload the preview (used by tests)
  const forceReloadPreview = useCallback(async () => {
    if (previewApiRef.current) {
      return previewApiRef.current.forceReload();
    }
    return Promise.resolve();
  }, []);

  if (!challengeData || isLoading || isScoreLoading || !fileSystem) return <div>{t("common.loading")}</div>;

  // Prepare preview template path based on the ROOT category, not the nested path
  const previewTemplatePath =
    challengeData.previewTemplatePath ||
    (rootCategory ? getCategoryResourcePath(rootCategory, "previewTemplate.js", language) : undefined);

  // Combine URL options with challenge data options
  const showPreview = options.showPreview && challengeData.showPreview;

  // Always use the grid layout if editors are shown (regardless of preview visibility)
  const useGridLayout = options.showEditors;

  return (
    <EmbedLayout
      title={challengeData.title}
      description={typeof challengeData.assignment === "string" ? challengeData.assignment : challengeData.assignment.join(" ")}
      score={currentScore}
      maxScore={challengeData.maxScore}
      options={options}
      className="bg-transparent"
    >
      {options.isScored && (
        <ChallengeTests
          categoryId={categoryPath}
          challengeId={challengeId}
          maxScore={challengeData.maxScore}
          onTestRun={handleTestRun}
          needsTestRun={needsTestRun}
          showNextButton={false}
          forceReloadPreview={forceReloadPreview}
        />
      )}

      <div className={useGridLayout ? "grid grid-cols-1 gap-4 md:grid-cols-2" : ""}>
        {options.showEditors && (
          <div className="flex flex-col h-[500px]">
            <ChallengeIDE fileSystem={fileSystem} />
          </div>
        )}

        <div className={`h-[500px] flex flex-col ${!options.showEditors ? "md:col-span-2" : ""}`}>
          <ChallengePreview
            fileSystem={fileSystem}
            mainFile={challengeData.mainFile}
            previewTemplatePath={previewTemplatePath}
            autoReload={options.autoReload}
            hidden={!showPreview}
            onIframeLoad={handleIframeLoad}
          />
        </div>
      </div>
    </EmbedLayout>
  );
};

export default EmbedChallengePage;
