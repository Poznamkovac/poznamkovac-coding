import type React from "react";
import type { ChallengeList } from "../types/challenge";
import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useFetchChallenges } from "../hooks/useFetchChallenges";
import { storageService } from "../services/storageService";
import { useI18n } from "../hooks/useI18n";

// Custom event name for score updates
const SCORE_UPDATE_EVENT = "scoreUpdate";

// Custom event for score updates
interface ScoreUpdateDetail {
  categoryId: string;
  challengeId: string;
  score: number;
  language?: string;
}

const ChallengeGrid: React.FC<{ challenges: ChallengeList; categoryId: string }> = ({ challenges, categoryId }) => {
  const [completionStatus, setCompletionStatus] = useState<{ [key: string]: { completed: boolean; score: number } }>({});
  const [isLoading, setIsLoading] = useState(true);
  const { t, language } = useI18n();

  useEffect(() => {
    // Initial load from IndexedDB
    const loadCompletionStatus = async () => {
      setIsLoading(true);
      const newCompletionStatus: { [key: string]: { completed: boolean; score: number } } = {};

      // Load scores for all challenges
      await Promise.all(
        Object.entries(challenges).map(async ([id, challenge]) => {
          const score = await storageService.getChallengeScore(categoryId, id, language);
          newCompletionStatus[id] = {
            completed: score === challenge.maxScore,
            score: score,
          };
        }),
      );

      setCompletionStatus(newCompletionStatus);
      setIsLoading(false);
    };

    // Load initial status
    loadCompletionStatus();

    // Set up event listener for score updates
    const handleScoreUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ScoreUpdateDetail>;
      const { categoryId: updatedCategoryId, challengeId, score, language: eventLanguage } = customEvent.detail;

      // Only update if it's for our category and the same language
      if (updatedCategoryId === categoryId && challenges[challengeId] && (!eventLanguage || eventLanguage === language)) {
        setCompletionStatus((prevStatus) => ({
          ...prevStatus,
          [challengeId]: {
            completed: score === challenges[challengeId].maxScore,
            score: score,
          },
        }));
      }
    };

    // Add event listener
    window.addEventListener(SCORE_UPDATE_EVENT, handleScoreUpdate);

    // Cleanup
    return () => {
      window.removeEventListener(SCORE_UPDATE_EVENT, handleScoreUpdate);
    };
  }, [challenges, categoryId, language]);

  if (isLoading) {
    return <div>{t("category.loadingChallengeStatus")}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(challenges).map(([id, challenge]) => (
        <Link
          key={id}
          to={`/challenges/${categoryId}/${id}`}
          className="p-6 transition duration-300 bg-blue-700 rounded-lg shadow-md hover:shadow-lg"
        >
          <h2 className="text-xl font-semibold">
            <div className="inline-block px-2 py-1 mr-2 text-white bg-blue-900 rounded-full text-bold">{id}.</div>
            {completionStatus[id]?.completed && "✅ "} {challenge.title}
            <span className="inline-block px-2 py-1 ml-2 text-sm bg-gray-700 rounded-lg white">
              <b>{t("challenge.score")}:</b> {completionStatus[id]?.score || 0} / {challenge.maxScore}
              {(completionStatus[id]?.score || 0) > challenge.maxScore && ` (${t("challenge.veryClever")})`}
            </span>
          </h2>
          <p
            className="mt-2 text-sm"
            dangerouslySetInnerHTML={{
              __html: challenge.assignment.split(" ").slice(0, 15).join(" ") + "...",
            }}
          />
          <div className="mt-2 text-sm"></div>
        </Link>
      ))}
    </div>
  );
};

/** Stránkovanie zoznamu úloh. */
const Pagination: React.FC<{ currentPage: number; isLastPage: boolean; onPageChange: (page: number) => void }> = ({
  currentPage,
  isLastPage,
  onPageChange,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex justify-center mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 mr-2 text-white bg-blue-500 rounded disabled:bg-gray-700 disabled:text-gray-400"
      >
        {t("pagination.previous")}
      </button>
      <span className="px-4 py-2">
        {t("pagination.page")} {currentPage}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage}
        className="px-4 py-2 ml-2 text-white bg-blue-500 rounded disabled:bg-gray-700 disabled:text-gray-400"
      >
        {t("pagination.next")}
      </button>
    </div>
  );
};

/** Stránka kategórie. Obsahuje zoznam úloh a stránkovanie. */
const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(parseInt(searchParams.get("strana") || "1", 10));
  const { t } = useI18n();

  const { challenges, isLastPage, isLoading } = useFetchChallenges(categoryId!, currentPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1) {
      setCurrentPage(newPage);
      navigate(`?strana=${newPage}`);
    }
  };

  const challengeEntries = useMemo(() => Object.entries(challenges), [challenges]);

  if (isLoading) {
    return <div>{t("category.loadingChallenges")}</div>;
  }

  if (challengeEntries.length === 0) {
    return (
      <div>
        <p>{t("category.noChallenges")}</p>
        {currentPage > 1 && (
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            {t("category.backToPrevious")}
          </button>
        )}
        <Link to="/" className="block mt-6 text-blue-600 underline">
          {t("common.backToHome")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ChallengeGrid challenges={challenges} categoryId={categoryId!} />
      <Pagination currentPage={currentPage} isLastPage={isLastPage} onPageChange={handlePageChange} />
    </div>
  );
};

export default CategoryPage;
