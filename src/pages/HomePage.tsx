import type React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocalizedResource } from "../hooks/useLocalizedResource";
import { useT } from "../services/i18nUtils";
import { Category } from "../types/category";

const CategoryCard: React.FC<{ category: Category; path: string }> = ({ category, path }) => {
  const t = useT();
  const categoryPath = path ? `${path}/${category.id}` : category.id;

  return (
    <Link
      key={category.id}
      to={`/challenges/${categoryPath}`}
      className="flex flex-row items-center justify-start gap-4 px-6 py-4 font-bold text-white transition duration-300 rounded shadow hover:opacity-80"
      style={{ backgroundColor: category.color }}
    >
      {category.icon && (
        <FontAwesomeIcon
          size="2x"
          // @ts-expect-error FontAwesome icon prop expects a different type but our API returns string array
          icon={["fab", category.icon]}
          className="mr-2"
          style={{ color: category.iconColor }}
        />
      )}
      {t(`categories.${category.id}.title`) || category.title}
    </Link>
  );
};

const CategoryList: React.FC<{ categories: Category[]; path: string }> = ({ categories, path }) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} path={path} />
      ))}
    </div>
  );
};

const HomePage: React.FC = () => {
  const t = useT();
  const { data: categories, loading, error } = useLocalizedResource<Category[]>("/data/categories.json");

  if (loading) {
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
      <CategoryList categories={categories} path="" />
    </div>
  );
};

export default HomePage;
