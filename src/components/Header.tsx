import type React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../hooks/useI18n";
import LanguageSwitch from "./LanguageSwitch";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <header className="p-4 text-white bg-indigo-900">
      <div className="container flex flex-col items-center justify-between gap-2 mx-auto sm:flex-row">
        <button onClick={() => navigate(-1)} className="font-extrabold text-blue-200">
          {t("header.back")}
        </button>
        <Link to="/" className="text-2xl font-bold text-center">
          {t("app.title")}
        </Link>
        <nav className="flex items-center gap-4">
          <LanguageSwitch />
        </nav>
      </div>
    </header>
  );
};

export default Header;
