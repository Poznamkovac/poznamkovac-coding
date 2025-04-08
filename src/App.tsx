import { HashRouter, Route, Routes } from "react-router-dom";

import { library } from "@fortawesome/fontawesome-svg-core";
import { faHtml5, faCss3, faJs } from "@fortawesome/free-brands-svg-icons";

import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ChallengePage from "./pages/ChallengePage";
import EmbedChallengePage from "./pages/EmbedChallengePage";
import EmbedCustomPage from "./pages/EmbedCustomPage";
import CreateEmbedPage from "./pages/CreateEmbedPage";

library.add(faHtml5, faCss3, faJs);

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Embed routes without header and footer */}
        <Route path="/embed/:categoryId/:challengeId" element={<EmbedChallengePage />} />
        <Route path="/embed/custom" element={<EmbedCustomPage />} />
        <Route path="/embed/create" element={<CreateEmbedPage />} />

        {/* Regular routes with header and footer */}
        <Route
          path="*"
          element={
            <div className="flex flex-col min-h-screen text-white bg-gray-900">
              <Header />
              <main className="container flex-grow px-4 py-8 mx-auto">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/challenges/:categoryId" element={<CategoryPage />} />
                  <Route path="/challenges/:categoryId/:challengeId" element={<ChallengePage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          }
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
