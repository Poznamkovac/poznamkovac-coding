import type React from "react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Category {
  id: string;
  title: string;
  ikona: string;
  ikonaFarba: string;
  farba: string;
}

const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/data/kategorie.json")
      .then((response) => response.json())
      .then((data) => setCategories(data))
      .catch((error) => console.error("Chyba pri načítaní kategórií:", error));
  }, []);

  if (categories.length === 0) return <div>Nie sú tu žiadne kategórie na zobrazenie.</div>;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Vitajte v Poznámkovač (Webúlohy)!</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/ulohy/${category.id}`}
            className="flex flex-row items-center justify-start gap-4 px-6 py-4 font-bold text-white transition duration-300 rounded shadow hover:opacity-80"
            style={{ backgroundColor: category.farba }}
          >
            <FontAwesomeIcon
              size="2x"
              // @ts-ignore
              icon={["fab", category.ikona]}
              className="mr-2"
              style={{ color: category.ikonaFarba }}
            />
            {category.title}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
