import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

interface Challenge {
  id: string;
  name: string;
  description: string;
}

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [categoryName, setCategoryName] = useState<string>("");

  useEffect(() => {
    // Fetch category name
    fetch("/data/categories.json")
      .then((response) => response.json())
      .then((data) => setCategoryName(data[categoryId as string]))
      .catch((error) => console.error("Chyba pri načítavaní názvu kategórie:", error));

    // Fetch challenges for the category
    fetch(`/data/challenges/${categoryId}/index.json`)
      .then((response) => response.json())
      .then((data) => setChallenges(data))
      .catch((error) => console.error("Chyba pri načítavaní úloh:", error));
  }, [categoryId]);

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
      <h1 className="mb-6 text-3xl font-bold">{categoryName} úlohy</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => (
          <Link
            key={challenge.id}
            to={`/challenge/${categoryId}/${challenge.id}`}
            className="p-6 transition duration-300 bg-blue-600 rounded-lg shadow-md hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold">{challenge.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryPage;
