import type React from "react";
import { Link } from "react-router-dom";
import LanguageSwitch from "./LanguageSwitch";

const Header: React.FC = () => {
  return (
    <header className="p-4 text-white bg-indigo-900">
      <div className="container flex flex-col items-center justify-between gap-2 mx-auto sm:flex-row">
        <Link to="/" className="text-2xl font-bold text-center">
          <span className="flex flex-row items-center">
            Poznámkovač<span className="self-start text-xs text-yellow-500 uppercase">Coding</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <LanguageSwitch />
        </nav>
      </div>
    </header>
  );
};

export default Header;
