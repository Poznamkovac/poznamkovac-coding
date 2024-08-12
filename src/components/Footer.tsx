import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="p-4 mt-8 bg-indigo-900">
      <div className="container mx-auto text-center">
        <p>&copy; 2024 Poznámkovač</p>
        <Link target="_blank" to="https://github.com/SKevo18/poznamkovac-webulohy" className="text-blue-300 hover:text-blue-200 hover:underline">
          Zdrojový kód (GitHub)
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
