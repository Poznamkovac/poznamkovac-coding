import { HashRouter, Route, Routes, useLocation } from "react-router-dom";

import { library } from "@fortawesome/fontawesome-svg-core";
import { faHtml5, faCss3, faJs, faPython } from "@fortawesome/free-brands-svg-icons";

import { I18nProvider } from "./contexts/I18nContext";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ChallengePage from "./pages/ChallengePage";
import EmbedChallengePage from "./pages/EmbedChallengePage";
import EmbedCustomPage from "./pages/EmbedCustomPage";
import CreateEmbedPage from "./pages/CreateEmbedPage";

library.add(faHtml5, faCss3, faJs, faPython);

// Helper function to check if a string is numeric
const isNumeric = (str: string): boolean => {
  return /^\d+$/.test(str);
};

function App() {
  return (
    <HashRouter>
      <I18nProvider>
        <Routes>
          {/* Embed routes without header */}
          <Route path="/embed/custom" element={<EmbedCustomPage />} />
          <Route path="/embed/create" element={<CreateEmbedPage />} />
          {/* Must come last in the embed routes so it doesn't match /embed/custom or /embed/create */}
          <Route path="/embed/*" element={<EmbedChallengePage />} />

          {/* Regular routes with header */}
          <Route
            path="*"
            element={
              <div className="flex flex-col min-h-screen text-white bg-gray-900">
                <Header />
                <main className="container flex-grow px-4 py-8 mx-auto">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    {/* Use a catch-all route and handle the distinction between challenge and category in the components */}
                    <Route path="/challenges/*" element={<CategoryOrChallengePage />} />
                  </Routes>
                </main>
              </div>
            }
          />
        </Routes>
      </I18nProvider>
    </HashRouter>
  );
}

// Helper component to determine if we're viewing a challenge or a category
const CategoryOrChallengePage: React.FC = () => {
  // has to be like this for some reason, else the assignment card is not clickable,
  // nor the breadcrumb navigation on assignments:
  useLocation();

  // Get the hash part without the leading # and any query parameters
  const hashPart = location.hash.split("?")[0];

  // Clean up the path to get just the parts after /challenges/
  const fullPath = hashPart.replace(/#\/challenges\//, "");
  const pathParts = fullPath.split("/").filter(Boolean);

  // Route decision logic:
  // 1. If there are no path parts, it's the category listing page
  if (pathParts.length === 0) {
    return <CategoryPage />;
  }

  // 2. If the last segment is numeric, it's a challenge page
  const lastPart = pathParts[pathParts.length - 1];

  // Make sure to only check the actual ID, not any query parameters
  if (isNumeric(lastPart)) {
    return <ChallengePage key={fullPath} />;
  }

  // 3. Otherwise it's a category page
  return <CategoryPage key={fullPath} />;
};

export default App;
