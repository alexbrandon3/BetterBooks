import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navigation = () => {
  const { logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Don't render navigation if not authenticated or still loading
  if (!isAuthenticated || isLoading) {
    return null;
  }

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <nav className="min-h-screen w-64 bg-gray-800 text-white flex flex-col shadow-lg">
      <div 
        className="p-6 text-2xl font-bold border-b border-gray-700 bg-gray-900 cursor-pointer hover:bg-gray-800 transition-colors duration-200"
        onClick={handleLogoClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleLogoClick();
          }
        }}
        aria-label="Navigate to Dashboard"
      >
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
      
      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full px-4 py-3 rounded-lg transition-all duration-200 font-medium text-gray-300 hover:bg-red-600 hover:text-white"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
