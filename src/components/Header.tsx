import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="p-4 text-white bg-indigo-900">
      <div className="container flex items-center justify-between mx-auto">
        <Link to="/" className="text-2xl font-bold">Poznámkovač Webúlohy</Link>
        <nav>
          <ul className="flex space-x-4">
            {/*<li><Link to="/" className="hover:underline">Domov</Link></li>*/}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
