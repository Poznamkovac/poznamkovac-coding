import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ChallengeIDE from "../components/ChallengeIDE";
import ChallengePreview from "../components/ChallengePreview";
import ChallengeTests from "../components/ChallengeTests";
import { useChallengeData } from "../hooks/useChallengeData";
import { useQueryParams } from "../hooks/useQueryParams";
import { storageService } from "../services/storageService";
import { FILE_CHANGE_EVENT, FileChangeEvent } from "../services/virtualFileSystemService";
import EmbedLayout from "../components/EmbedLayout";

const EmbedChallengePage: React.FC = () => {
  const { categoryId, challengeId } = useParams<{ categoryId: string; challengeId: string }>();
  const { challengeData, fileSystem, isLoading } = useChallengeData(categoryId!, challengeId!);
  const { options } = useQueryParams();
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [isScoreLoading, setIsScoreLoading] = useState(true);
  const [needsTestRun, setNeedsTestRun] = useState(false);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);

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

  const handleIframeLoad = () => {
    setIsPreviewLoaded(true);
  };

  if (!challengeData || isLoading || isScoreLoading || !fileSystem) return <div>⌛️...</div>;

  // Prepare preview template path based on category
  const previewTemplatePath =
    challengeData.previewTemplatePath || (categoryId ? `/data/challenges/${categoryId}/previewTemplate.js` : undefined);

  // Combine URL options with challenge data options
  const showPreview = options.showPreview && challengeData.showPreview;

  // Always use the grid layout if editors are shown (regardless of preview visibility)
  const useGridLayout = options.showEditors;

  return (
    <EmbedLayout
      title={challengeData.title}
      description={challengeData.assignment}
      score={currentScore}
      maxScore={challengeData.maxScore}
      options={options}
      className="bg-transparent"
    >
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
            previewType={challengeData.previewType}
            previewTemplatePath={previewTemplatePath}
            autoReload={options.autoReload}
            hidden={!showPreview}
            onIframeLoad={handleIframeLoad}
          />

          {options.isScored && (
            <ChallengeTests
              categoryId={categoryId!}
              challengeId={challengeId!}
              maxScore={challengeData.maxScore}
              onTestRun={handleTestRun}
              needsTestRun={needsTestRun}
              showNextButton={false}
            />
          )}
        </div>
      </div>
    </EmbedLayout>
  );
};

export default EmbedChallengePage;
