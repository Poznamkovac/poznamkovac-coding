import type React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useI18n } from "../hooks/useI18n";
import { useLocalizedResource } from "../hooks/useLocalizedResource";

interface Category {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  color: string;
}

const HomePage: React.FC = () => {
  const { t, isLoading: translationsLoading } = useI18n();
  const { data: categories, loading, error } = useLocalizedResource<Category[]>("/data/categories.json");

  if (translationsLoading || loading) {
    return <div>{t("common.loading")}</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!categories || categories.length === 0) {
    return <div>{t("common.noCategories")}</div>;
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{t("app.welcome")}</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/challenges/${category.id}`}
            className="flex flex-row items-center justify-start gap-4 px-6 py-4 font-bold text-white transition duration-300 rounded shadow hover:opacity-80"
            style={{ backgroundColor: category.color }}
          >
            <FontAwesomeIcon
              size="2x"
              // @ts-expect-error FontAwesome icon prop expects a different type but our API returns string array
              icon={["fab", category.icon]}
              className="mr-2"
              style={{ color: category.iconColor }}
            />
            {t(`categories.${category.id}.title`) || category.title}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
