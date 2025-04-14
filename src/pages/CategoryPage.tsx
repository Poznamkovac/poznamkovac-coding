import type React from "react";
import type { ChallengeList } from "../types/challenge";
import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useFetchChallenges } from "../hooks/useFetchChallenges";
import { storageService } from "../services/storageService";
import { useI18n } from "../hooks/useI18n";
import { useLocalizedResource } from "../hooks/useLocalizedResource";
import { Category } from "../types/category";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Custom event name for score updates
const SCORE_UPDATE_EVENT = "scoreUpdate";

// Custom event for score updates
interface ScoreUpdateDetail {
  categoryId: string;
  challengeId: string;
  score: number;
  language?: string;
}

// Function to check if a string is a numeric value
const isNumeric = (str: string): boolean => {
  return /^\d+$/.test(str);
};

const ChallengeGrid: React.FC<{ challenges: ChallengeList; categoryPath: string }> = ({ challenges, categoryPath }) => {
  const [completionStatus, setCompletionStatus] = useState<{ [key: string]: { completed: boolean; score: number } }>({});
  const [isLoading, setIsLoading] = useState(true);
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Initial load from IndexedDB
    const loadCompletionStatus = async () => {
      setIsLoading(true);
      const newCompletionStatus: { [key: string]: { completed: boolean; score: number } } = {};

      // Load scores for all challenges
      await Promise.all(
        Object.entries(challenges).map(async ([id, challenge]) => {
          const score = await storageService.getChallengeScore(categoryPath, id, language);
          newCompletionStatus[id] = {
            completed: score === challenge.maxScore,
            score: score,
          };
        })
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
      if (updatedCategoryId === categoryPath && challenges[challengeId] && (!eventLanguage || eventLanguage === language)) {
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
  }, [challenges, categoryPath, language]);

  if (isLoading) {
    return <div>{t("category.loadingChallengeStatus")}</div>;
  }

  // Function to navigate to challenge (keeping query params)
  const handleChallengeClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams(location.search).toString();
    const destination = `/challenges/${categoryPath}/${id}${queryParams ? `?${queryParams}` : ""}`;
    navigate(destination);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(challenges).map(([id, challenge]) => (
        <a
          key={id}
          href={`#/challenges/${categoryPath}/${id}`}
          className="p-6 transition duration-300 bg-blue-700 rounded-lg shadow-md hover:shadow-lg"
          onClick={handleChallengeClick(id)}
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
        </a>
      ))}
    </div>
  );
};

const SubCategoryGrid: React.FC<{ categories: Category[]; currentPath: string }> = ({ categories, currentPath }) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/challenges/${currentPath ? `${currentPath}/` : ""}${category.id}`}
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
          {category.title}
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

// Helper function to find a category in the hierarchy
const findCategoryInHierarchy = (
  categories: Category[],
  pathParts: string[],
  currentIndex = 0,
  currentPath = ""
): { category: Category | null; fullPath: string } => {
  if (pathParts.length === 0) return { category: null, fullPath: "" };

  const currentId = pathParts[currentIndex];

  // If the current part is numeric, it's likely a challenge ID, not a category
  if (isNumeric(currentId)) {
    return { category: null, fullPath: "" };
  }

  const nextPath = currentPath ? `${currentPath}/${currentId}` : currentId;

  const foundCategory = categories.find((cat) => cat.id === currentId);

  if (!foundCategory) return { category: null, fullPath: "" };

  // If we're at the last part of the path, return this category
  if (currentIndex === pathParts.length - 1) {
    return { category: foundCategory, fullPath: nextPath };
  }

  // If there are children, search in them
  if (foundCategory.children && foundCategory.children.length > 0) {
    return findCategoryInHierarchy(foundCategory.children, pathParts, currentIndex + 1, nextPath);
  }

  // If we didn't find a match in children but still have path parts, consider this category the match
  return { category: foundCategory, fullPath: nextPath };
};

/** Stránka kategórie. Obsahuje zoznam úloh a stránkovanie. */
const CategoryPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(parseInt(searchParams.get("strana") || "1", 10));
  const { t } = useI18n();

  // Extract path parts from the location (excluding query parameters)
  const rawPathParts = useMemo(() => {
    // Get the raw path (without query string) and remove /challenges/ prefix
    const rawPath = location.pathname.replace(/^\/challenges\//, "");
    // Split into parts and filter empty segments
    return rawPath.split("/").filter((part) => part !== "");
  }, [location.pathname]);

  // Filter out any numeric path part at the end (which would be a challenge ID)
  const categoryPathParts = useMemo(() => {
    if (rawPathParts.length === 0) return [];

    // If the last part is numeric, it's a challenge ID and should not be included in the category path
    const lastPart = rawPathParts[rawPathParts.length - 1];
    if (isNumeric(lastPart)) {
      return rawPathParts.slice(0, rawPathParts.length - 1);
    }
    return rawPathParts;
  }, [rawPathParts]);

  // Join the path parts to form the category path
  const categoryPath = useMemo(() => categoryPathParts.join("/"), [categoryPathParts]);

  // Load all categories
  const { data: allCategories, loading: loadingCategories } = useLocalizedResource<Category[]>("/data/categories.json");

  // Find the current category and its children in the hierarchy
  const categoryInfo = useMemo(() => {
    if (!allCategories || categoryPathParts.length === 0) {
      // For the home page, return a special value
      return { category: { id: "", title: t("app.welcome"), color: "#333", children: allCategories }, fullPath: "" };
    }
    return findCategoryInHierarchy(allCategories, categoryPathParts);
  }, [allCategories, categoryPathParts, t]);

  const { challenges, isLastPage, isLoading: loadingChallenges } = useFetchChallenges(categoryPath, currentPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1) {
      setCurrentPage(newPage);
      // Preserve existing query parameters
      const newParams = new URLSearchParams(searchParams);
      newParams.set("strana", newPage.toString());
      navigate(`?${newParams.toString()}`);
    }
  };

  const challengeEntries = useMemo(() => Object.entries(challenges), [challenges]);
  const isLoading = loadingCategories || loadingChallenges;

  if (isLoading) {
    return <div>{t("category.loadingChallenges")}</div>;
  }

  // Check if category exists
  if (!categoryInfo.category) {
    return (
      <div>
        <p>{t("category.notFound")}</p>
        <Link to="/" className="block mt-6 text-blue-600 underline">
          {t("common.backToHome")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb navigation */}
      <div className="mb-6">
        <Link to="/" className="text-blue-400 hover:underline">
          {t("header.home")}
        </Link>
        {categoryPathParts.map((part, index) => {
          // Create the path up to this part
          const pathToHere = categoryPathParts.slice(0, index + 1).join("/");
          return (
            <span key={pathToHere}>
              <span className="mx-2 text-gray-500">/</span>
              {index === categoryPathParts.length - 1 ? (
                <span className="text-white">{part}</span>
              ) : (
                <Link to={`/challenges/${pathToHere}`} className="text-blue-400 hover:underline">
                  {part}
                </Link>
              )}
            </span>
          );
        })}
      </div>

      <h1 className="mb-6 text-3xl font-bold">{categoryInfo.category.title}</h1>

      {/* Render subcategories if present */}
      {categoryInfo.category.children && (
        <SubCategoryGrid categories={categoryInfo.category.children} currentPath={categoryPath} />
      )}

      {/* Show challenges if there are any */}
      {challengeEntries.length > 0 ? (
        <>
          <ChallengeGrid challenges={challenges} categoryPath={categoryPath} />
          <Pagination currentPage={currentPage} isLastPage={isLastPage} onPageChange={handlePageChange} />
        </>
      ) : (
        !categoryInfo.category.children && (
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
          </div>
        )
      )}
    </div>
  );
};

export default CategoryPage;
