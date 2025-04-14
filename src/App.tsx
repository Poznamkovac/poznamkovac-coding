import { HashRouter, Route, Routes } from "react-router-dom";

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

function App() {
  return (
    <HashRouter>
      <I18nProvider>
        <Routes>
          {/* Embed routes without header */}
          <Route path="/embed/custom" element={<EmbedCustomPage />} />
          <Route path="/embed/create" element={<CreateEmbedPage />} />
          {/* Must come last in the embed routes so it doesn't match /embed/custom or /embed/create */}
          <Route path="/embed/:categoryPath/:challengeId" element={<EmbedChallengePage />} />

          {/* Regular routes with header */}
          <Route
            path="*"
            element={
              <div className="flex flex-col min-h-screen text-white bg-gray-900">
                <Header />
                <main className="container flex-grow px-4 py-8 mx-auto">
                  <Routes>
                    <Route path="/" element={<HomePage />} />

                    {/* 
                      Route order matters: 
                      1. First try to match challenge routes with pattern like /challenges/python/basic/introduction/1
                      2. Then fallback to the wildcard route for category listing
                    */}
                    <Route path="/challenges/:categoryPath/:challengeId" element={<ChallengePage />} />
                    <Route path="/challenges/*" element={<CategoryPage />} />
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

export default App;
