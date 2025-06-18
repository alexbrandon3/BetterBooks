import React from "react";
import { NavLink } from "react-router-dom";

const Navigation = () => {
  return (
    <nav className="min-h-screen w-64 bg-gray-800 text-white flex flex-col shadow-lg">
      <div className="p-6 text-2xl font-bold border-b border-gray-700 bg-gray-900">
        BetterBooks
      </div>
      <div className="flex-grow p-4 space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `block px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
              isActive
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `block px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
              isActive
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`
          }
        >
          Transactions
        </NavLink>
        <NavLink
          to="/accounts"
          className={({ isActive }) =>
            `block px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
              isActive
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`
          }
        >
          Accounts
        </NavLink>
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `block px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
              isActive
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`
          }
        >
          Reports
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `block px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
              isActive
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`
          }
        >
          Settings
        </NavLink>
      </div>
    </nav>
  );
};

export default Navigation;
