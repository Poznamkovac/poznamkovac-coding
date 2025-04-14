import type React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useChallengeData } from "../hooks/useChallengeData";
import ChallengeIDE from "../components/ChallengeIDE";
import ChallengePreview from "../components/ChallengePreview";
import ChallengeTests from "../components/ChallengeTests";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { storageService } from "../services/storageService";
import { FILE_CHANGE_EVENT, FileChangeEvent } from "../services/virtualFileSystemService";
import { useQueryParams } from "../hooks/useQueryParams";
import { useI18n } from "../hooks/useI18n";
import { getCategoryResourcePath } from "../services/i18nService";

const ChallengePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { options } = useQueryParams();
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [isScoreLoading, setIsScoreLoading] = useState(true);
  const [needsTestRun, setNeedsTestRun] = useState(false);
  const previewApiRef = useRef<{ forceReload: () => Promise<void> } | null>(null);
  const previewReadyRef = useRef<boolean>(false);
  const { language, t } = useI18n();

  // Extract path parts from the location
  const pathParts = useMemo(() => {
    // Remove /challenges/ from the beginning of the path, and strip any query parameters
    const pathname = location.pathname;
    const path = pathname.replace(/^\/challenges\//, "");
    return path.split("/").filter((part) => part !== "");
  }, [location.pathname]);

  // The last part is the challenge ID if it's numeric
  const challengeId = useMemo(() => {
    if (pathParts.length === 0) return "";
    const lastPart = pathParts[pathParts.length - 1];
    return lastPart;
  }, [pathParts]);

  // Everything before the challenge ID is the category path
  const categoryPath = useMemo(() => {
    // Remove the challenge ID from the path parts
    return pathParts.slice(0, pathParts.length - 1).join("/");
  }, [pathParts]);

  // Category path parts for breadcrumb (excluding challenge ID)
  const categoryPathParts = useMemo(() => {
    return pathParts.slice(0, pathParts.length - 1);
  }, [pathParts]);

  // Get the root category for previewTemplate.js
  const rootCategory = useMemo(() => {
    return categoryPathParts.length > 0 ? categoryPathParts[0] : "";
  }, [categoryPathParts]);

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

      // Listen for preview ready messages
      const handlePreviewReady = (event: MessageEvent) => {
        if (event.data && event.data.type === "PREVIEW_READY") {
          previewReadyRef.current = true;
        } else if (event.data && event.data.type === "PREVIEW_RELOADING") {
          previewReadyRef.current = false;
        }
      };

      // Add event listeners
      window.addEventListener("scoreUpdate", handleScoreUpdate);
      window.addEventListener(FILE_CHANGE_EVENT, handleFileChange);
      window.addEventListener("message", handlePreviewReady);

      // Cleanup
      return () => {
        window.removeEventListener("scoreUpdate", handleScoreUpdate);
        window.removeEventListener(FILE_CHANGE_EVENT, handleFileChange);
        window.removeEventListener("message", handlePreviewReady);
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
    // Reset the preview ready flag
    previewReadyRef.current = false;

    if (previewApiRef.current) {
      await previewApiRef.current.forceReload();

      // Wait for the preview to signal it's ready
      if (!previewReadyRef.current) {
        await new Promise<void>((resolve, reject) => {
          const checkInterval = 100; // ms
          const maxWaitTime = 30000; // 30 seconds timeout
          let elapsedTime = 0;

          const checkReadyState = () => {
            if (previewReadyRef.current) {
              resolve();
            } else if (elapsedTime >= maxWaitTime) {
              reject(new Error("Timeout waiting for preview to be ready"));
            } else {
              elapsedTime += checkInterval;
              setTimeout(checkReadyState, checkInterval);
            }
          };

          checkReadyState();
        });
      }
    }
    return Promise.resolve();
  }, []);

  if (!challengeData || isLoading || isScoreLoading || !fileSystem) return <div>{t("common.loading")}</div>;

  // Prepare preview template path based on the ROOT category, not the full path
  const previewTemplatePath =
    challengeData.previewTemplatePath ||
    (rootCategory ? getCategoryResourcePath(rootCategory, "previewTemplate.js", language) : undefined);

  // Get localized image URL
  const imageUrl = getCategoryResourcePath(categoryPath, `${challengeId}/obrazok.png`, language);

  // Function to navigate to category (keeping query params)
  const navigateToCategory = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams(location.search).toString();
    const destination = `/challenges/${path}${queryParams ? `?${queryParams}` : ""}`;
    navigate(destination);
  };

  return (
    <div className="min-h-screen text-white">
      <main className="container p-4 mx-auto">
        {/* Breadcrumb navigation */}
        <div className="mb-6">
          <Link to="/" className="text-blue-400 hover:underline">
            {t("header.home")}
          </Link>
          {categoryPathParts.map((part, index) => {
            // Create the path up to this part
            const pathToHere = categoryPathParts.slice(0, index + 1).join("/");
            return (
              <span key={pathToHere}>
                <span className="mx-2 text-gray-500">/</span>
                {index === categoryPathParts.length - 1 ? (
                  <span className="text-white">{part}</span>
                ) : (
                  <a
                    href={`#/challenges/${pathToHere}`}
                    className="text-blue-400 hover:underline"
                    onClick={navigateToCategory(pathToHere)}
                  >
                    {part}
                  </a>
                )}
              </span>
            );
          })}
          {challengeId && (
            <>
              <span className="mx-2 text-gray-500">/</span>
              <span className="text-white">{challengeId}</span>
            </>
          )}
        </div>

        {options.showAssignment && (
          <>
            <h2 className="my-4 text-3xl font-bold">
              {options.isScored && currentScore === challengeData.maxScore && "✅ "}
              {options.isScored && currentScore > challengeData.maxScore && `(${t("challenge.veryClever")})`}
              {challengeData.title}
              {options.isScored && (
                <span className="ml-2 text-xl font-normal">
                  ({currentScore} / {challengeData.maxScore})
                </span>
              )}
            </h2>

            <p className="mb-6" dangerouslySetInnerHTML={{ __html: challengeData.assignment }} />
            <div className="mb-6">
              <img
                src={imageUrl}
                alt={challengeData.title}
                className="h-auto max-w-full"
                onError={(e) => e.currentTarget.remove()}
              />
            </div>
          </>
        )}

        <div className={options.showPreview ? "grid grid-cols-1 gap-4 md:grid-cols-2" : ""}>
          {options.showEditors && (
            <div className="flex flex-col h-[500px]">
              <ChallengeIDE fileSystem={fileSystem} />
            </div>
          )}

          <div className={`h-[500px] flex flex-col ${!options.showEditors ? "md:col-span-2" : ""}`}>
            <ChallengePreview
              fileSystem={fileSystem}
              mainFile={challengeData.mainFile}
              previewType={challengeData.previewType}
              previewTemplatePath={previewTemplatePath}
              autoReload={options.autoReload}
              hidden={!options.showPreview || !challengeData.showPreview}
              onIframeLoad={handleIframeLoad}
            />

            {options.isScored && (
              <ChallengeTests
                categoryId={categoryPath}
                challengeId={challengeId}
                maxScore={challengeData.maxScore}
                onTestRun={handleTestRun}
                needsTestRun={needsTestRun}
                files={challengeData.files.map((file) => file.filename)}
                readonlyFiles={challengeData.files.filter((file) => file.readonly).map((file) => file.filename)}
                forceReloadPreview={forceReloadPreview}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChallengePage;
