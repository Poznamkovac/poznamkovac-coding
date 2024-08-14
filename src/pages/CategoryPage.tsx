import type React from "react";
import type { ChallengeList } from "../types/challenge";
import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useFetchChallenges } from "../hooks/useFetchChallenges";

const ChallengeGrid: React.FC<{ challenges: ChallengeList; categoryId: string }> = ({ challenges, categoryId }) => {
  const [completionStatus, setCompletionStatus] = useState<{ [key: string]: { completed: boolean; score: number } }>({});

  useEffect(() => {
    const newCompletionStatus: { [key: string]: { completed: boolean; score: number } } = {};
    Object.entries(challenges).forEach(([id, challenge]) => {
      const storedScore = localStorage.getItem(`uloha_${categoryId}_${id}_skore`);
      const score = storedScore ? parseInt(storedScore, 10) : 0;
      newCompletionStatus[id] = {
        completed: score === challenge.maxSkore,
        score: score,
      };
    });
    setCompletionStatus(newCompletionStatus);
  }, [challenges, categoryId]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(challenges).map(([id, challenge]) => (
        <Link
          key={id}
          to={`/ulohy/${categoryId}/${id}`}
          className="p-6 transition duration-300 bg-blue-700 rounded-lg shadow-md hover:shadow-lg"
        >
          <h2 className="text-xl font-semibold">
            <div className="inline-block px-2 py-1 mr-2 text-white bg-blue-900 rounded-full text-bold">{id}.</div>
            {completionStatus[id]?.completed && "✅ "} {challenge.nazov}
          </h2>
          <p
            className="mt-2 text-sm"
            dangerouslySetInnerHTML={{
              __html: challenge.zadanie.split(" ").slice(0, 15).join(" ") + "...",
            }}
          />
          <div className="mt-2 text-sm">
            <div className="inline-block px-2 py-1 text-xs bg-gray-700 rounded-lg white">
              <b>Skóre:</b> {completionStatus[id]?.score || 0} / {challenge.maxSkore}
              {(completionStatus[id]?.score || 0) > challenge.maxSkore && " (si veľmi šikovný :D)"}
            </div>
          </div>
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
}) => (
  <div className="flex justify-center mt-8">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="px-4 py-2 mr-2 text-white bg-blue-500 rounded disabled:bg-gray-700 disabled:text-gray-400"
    >
      Predchádzajúca
    </button>
    <span className="px-4 py-2">Strana {currentPage}</span>
    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={isLastPage}
      className="px-4 py-2 ml-2 text-white bg-blue-500 rounded disabled:bg-gray-700 disabled:text-gray-400"
    >
      Ďalšia
    </button>
  </div>
);

/** Stránka kategórie. Obsahuje zoznam úloh a stránkovanie. */
const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(parseInt(searchParams.get("strana") || "1", 10));

  const { challenges, isLastPage, isLoading } = useFetchChallenges(categoryId!, currentPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1) {
      setCurrentPage(newPage);
      navigate(`?strana=${newPage}`);
    }
  };

  const challengeEntries = useMemo(() => Object.entries(challenges), [challenges]);

  if (isLoading) {
    return <div>Načítavam úlohy...</div>;
  }

  if (challengeEntries.length === 0) {
    return (
      <div>
        <p>Ups, nie sú tu žiadne úlohy na zobrazenie.</p>
        {currentPage > 1 && (
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Späť na predchádzajúcu stranu
          </button>
        )}
        <Link to="/" className="block mt-6 text-blue-600 underline">
          Späť na domovskú stránku
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
