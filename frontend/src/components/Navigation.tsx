import React from "react";
import { NavLink } from "react-router-dom";

const Navigation = () => {
  return (
    <nav className="min-h-screen w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 text-2xl font-bold border-b border-gray-700">
        BetterBooks
      </div>
      <div className="flex-grow">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive
              ? "block px-4 py-2 bg-gray-700"
              : "block px-4 py-2 hover:bg-gray-700"
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            isActive
              ? "block px-4 py-2 bg-gray-700"
              : "block px-4 py-2 hover:bg-gray-700"
          }
        >
          Transactions
        </NavLink>
        <NavLink
          to="/accounts"
          className={({ isActive }) =>
            isActive
              ? "block px-4 py-2 bg-gray-700"
              : "block px-4 py-2 hover:bg-gray-700"
          }
        >
          Accounts
        </NavLink>
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            isActive
              ? "block px-4 py-2 bg-gray-700"
              : "block px-4 py-2 hover:bg-gray-700"
          }
        >
          Reports
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive
              ? "block px-4 py-2 bg-gray-700"
              : "block px-4 py-2 hover:bg-gray-700"
          }
        >
          Settings
        </NavLink>
      </div>
    </nav>
  );
};

export default Navigation;
