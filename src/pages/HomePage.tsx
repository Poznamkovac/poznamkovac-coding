import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Categories {
  [key: string]: string;
}

const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Categories>({});

  useEffect(() => {
    fetch("/data/kategorie.json")
      .then((response) => response.json())
      .then((data) => setCategories(data))
      .catch((error) => console.error("Chyba pri načítaní kategórií:", error));
  }, []);

  if (categories === null) return <div>Nie sú tu žiadne kategórie na zobrazenie.</div>;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Vitajte v Poznámkovač (Webúlohy)!</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {Object.entries(categories).map(([id, name]) => (
          <Link
            key={id}
            to={`/ulohy/${id}`}
            className="px-6 py-4 font-bold text-white transition duration-300 bg-blue-500 rounded shadow hover:bg-blue-700"
          >
            <FontAwesomeIcon
              // @ts-ignore
              icon={["fab", id]}
              className="mr-2"
            />
            {name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
