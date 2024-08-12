import { HashRouter, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ChallengePage from "./pages/ChallengePage";

import { library } from "@fortawesome/fontawesome-svg-core";
import { faHtml5, faCss3, faJs } from "@fortawesome/free-brands-svg-icons";

library.add(faHtml5, faCss3, faJs);

function App() {
  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen text-white bg-gray-900">
        <Header />
        <main className="container flex-grow px-4 py-8 mx-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/challenge/:categoryId/:challengeId" element={<ChallengePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}

export default App;
