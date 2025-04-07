import type React from "react";
import { useParams } from "react-router-dom";
import { useChallengeData } from "../hooks/useChallengeData";
import ChallengeIDE from "../components/ChallengeIDE";
import ChallengePreview from "../components/ChallengePreview";
import ChallengeTests from "../components/ChallengeTests";
import { useEffect, useState } from "react";
import { storageService } from "../services/storageService";

const ChallengePage: React.FC = () => {
  const { categoryId, challengeId } = useParams();
  const { challengeData, fileSystem, isLoading } = useChallengeData(categoryId!, challengeId!);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [isScoreLoading, setIsScoreLoading] = useState(true);

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

      // Add event listener
      window.addEventListener("scoreUpdate", handleScoreUpdate);

      // Cleanup
      return () => {
        window.removeEventListener("scoreUpdate", handleScoreUpdate);
      };
    }
  }, [challengeData, categoryId, challengeId]);

  if (!challengeData || isLoading || isScoreLoading || !fileSystem) return <div>Loading...</div>;

  return (
    <div className="min-h-screen text-white">
      <main className="container p-4 mx-auto">
        <h2 className="my-4 text-3xl font-bold">
          {currentScore === challengeData.maxScore && "✅ "}
          {currentScore > challengeData.maxScore && "(si veľmi šikovný :D)"}
          {challengeData.title}
          <span className="ml-2 text-xl font-normal">
            (Score: {currentScore} / {challengeData.maxScore})
          </span>
        </h2>

        <p className="mb-6" dangerouslySetInnerHTML={{ __html: challengeData.assignment }} />
        <div className="mb-6">
          <img
            src={`/data/ulohy/${categoryId}/${challengeId}/obrazok.png`}
            alt="Assignment image"
            className="h-auto max-w-full"
            onError={(e) => e.currentTarget.remove()}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col h-[500px]">
            <ChallengeIDE fileSystem={fileSystem} />
          </div>

          <div className="h-[500px] flex flex-col">
            <ChallengePreview fileSystem={fileSystem} />
            <ChallengeTests categoryId={categoryId!} challengeId={challengeId!} maxScore={challengeData.maxScore} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChallengePage;
