import type React from "react";
import { Link, useNavigate } from "react-router-dom";

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="p-4 text-white bg-indigo-900">
      <div className="container flex flex-col items-center justify-between gap-2 mx-auto sm:flex-row">
        <button onClick={() => navigate(-1)} className="font-extrabold text-blue-200">
          ⏪ Späť
        </button>
        <Link to="/" className="text-2xl font-bold text-center">
          Poznámkovač Webúlohy
        </Link>
        <nav>
          <ul className="flex space-x-4">{/*<li><Link to="/" className="hover:underline">Domov</Link></li>*/}</ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
