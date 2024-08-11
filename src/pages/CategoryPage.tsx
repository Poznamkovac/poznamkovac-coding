import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";

interface Challenge {
  id: string;
  name: string;
  description: string;
}

interface ChallengeCounts {
  [category: string]: number;
}

const CHALLENGES_PER_PAGE = 10;

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [totalChallenges, setTotalChallenges] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(parseInt(searchParams.get("strana") || "1", 10));

  useEffect(() => {
    const fetchChallengeCounts = async () => {
      try {
        const response = await fetch('/data/challenge-counts.json');
        const counts: ChallengeCounts = await response.json();
        if (categoryId && counts[categoryId]) {
          setTotalChallenges(counts[categoryId]);
        }
      } catch (error) {
        console.error("Chyba pri načítavaní počtu úloh:", error);
      }
    };

    fetchChallengeCounts();
  }, [categoryId]);

  useEffect(() => {
    const fetchChallenges = async () => {
      const startIndex = (currentPage - 1) * CHALLENGES_PER_PAGE + 1;
      const endIndex = Math.min(startIndex + CHALLENGES_PER_PAGE - 1, totalChallenges);

      const challengePromises = [];
      for (let i = startIndex; i < endIndex; i++) {
        challengePromises.push(
          fetch(`/data/ulohy/${categoryId}/${i}/zadanie.json`)
            .then((response) => response.json())
            .then((data) => ({ ...data, id: i.toString() }))
        );
      }

      try {
        const fetchedChallenges = await Promise.all(challengePromises);
        setChallenges(fetchedChallenges);
      } catch (error) {
        console.error("Chyba pri načítavaní úloh:", error);
      }
    };

    if (totalChallenges > 0) {
      fetchChallenges();
    }
  }, [categoryId, currentPage, totalChallenges]);

  useEffect(() => {
    navigate(`?strana=${currentPage}`);
  }, [currentPage, navigate]);

  const totalPages = Math.ceil(totalChallenges / CHALLENGES_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (challenges.length === 0)
    return (
      <div>
        <p>Nie sú tu žiadne úlohy na zobrazenie.</p>
        <Link to="/" className="mt-6 text-blue-600 underline">
          Späť na domovskú stránku
        </Link>
      </div>
    );

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{categoryId} úlohy</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => (
          <Link
            key={challenge.id}
            to={`/challenge/${categoryId}/${challenge.id}`}
            className="p-6 transition duration-300 bg-blue-600 rounded-lg shadow-md hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold">{challenge.name}</h2>
            <p className="mt-2 text-sm">{challenge.description.slice(0, 100)}{challenge.description.length > 100 && '...'}</p>
          </Link>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 mr-2 text-white bg-blue-500 rounded disabled:bg-gray-300"
          >
            Predchádzajúca
          </button>
          <span className="px-4 py-2">
            Strana {currentPage} z {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 ml-2 text-white bg-blue-500 rounded disabled:bg-gray-300"
          >
            Ďalšia
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;