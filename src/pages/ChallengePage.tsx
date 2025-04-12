import type React from "react";
import { useParams } from "react-router-dom";
import { useChallengeData } from "../hooks/useChallengeData";
import ChallengeIDE from "../components/ChallengeIDE";
import ChallengePreview from "../components/ChallengePreview";
import ChallengeTests from "../components/ChallengeTests";
import { useEffect, useState, useRef, useCallback } from "react";
import { storageService } from "../services/storageService";
import { FILE_CHANGE_EVENT, FileChangeEvent } from "../services/virtualFileSystemService";
import { useQueryParams } from "../hooks/useQueryParams";

const ChallengePage: React.FC = () => {
  const { categoryId, challengeId } = useParams();
  const { challengeData, fileSystem, isLoading } = useChallengeData(categoryId!, challengeId!);
  const { options } = useQueryParams();
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [isScoreLoading, setIsScoreLoading] = useState(true);
  const [needsTestRun, setNeedsTestRun] = useState(false);
  const previewApiRef = useRef<{ forceReload: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (challengeData) {
      const loadScore = async () => {
        setIsScoreLoading(true);
        const score = await storageService.getChallengeScore(categoryId!, challengeId!);
        setCurrentScore(score);
        setIsScoreLoading(false);
      };

      loadScore();

      // Set up event listener for score updates
      const handleScoreUpdate = (event: Event) => {
        const customEvent = event as CustomEvent<{ categoryId: string; challengeId: string; score: number }>;
        const { categoryId: updatedCategoryId, challengeId: updatedChallengeId, score } = customEvent.detail;

        if (updatedCategoryId === categoryId && updatedChallengeId === challengeId) {
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
  }, [challengeData, categoryId, challengeId, options.autoReload]);

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

  if (!challengeData || isLoading || isScoreLoading || !fileSystem) return <div>⌛️...</div>;

  // Prepare preview template path based on category
  const previewTemplatePath =
    challengeData.previewTemplatePath || (categoryId ? `/data/challenges/${categoryId}/previewTemplate.js` : undefined);

  return (
    <div className="min-h-screen text-white">
      <main className="container p-4 mx-auto">
        {options.showAssignment && (
          <>
            <h2 className="my-4 text-3xl font-bold">
              {options.isScored && currentScore === challengeData.maxScore && "✅ "}
              {options.isScored && currentScore > challengeData.maxScore && "(si veľmi šikovný :D)"}
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
                src={`/data/challenges/${categoryId}/${challengeId}/obrazok.png`}
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
                categoryId={categoryId!}
                challengeId={challengeId!}
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
