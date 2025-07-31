import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navigation = () => {
  const { logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Don't render navigation if not authenticated or still loading
  if (!isAuthenticated || isLoading) {
    return null;
  }

  const handleLogoClick = () => {
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const handleNavLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { to: "/", label: "Dashboard", icon: "📊" },
    { to: "/transactions", label: "Transactions", icon: "💰" },
    { to: "/transaction-history", label: "History", icon: "📋" },
    { to: "/accounts", label: "Accounts", icon: "🏦" },
    { to: "/reports", label: "Reports", icon: "📈" },
    { to: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <>
      {/* Mobile Navigation - Top Bar */}
      <div className="lg:hidden">
        {/* Mobile Top Header */}
        <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between shadow-xl">
          <div 
            className="text-2xl font-bold cursor-pointer hover:text-blue-200 transition-all duration-200 flex items-center"
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
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl mr-3 flex items-center justify-center">
              <span className="text-sm font-bold text-white">BB</span>
            </div>
            BetterBooks
          </div>
          
          {/* Hamburger Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="p-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white/20 rounded-2xl mr-3 flex items-center justify-center">
                        <span className="text-lg font-bold">BB</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">BetterBooks</h2>
                        <p className="text-blue-100 text-sm">Business Finance</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleMobileMenu}
                      className="p-2 rounded-xl text-white hover:bg-white/10 transition-all duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Mobile Menu Links */}
                <div className="flex-1 px-6 py-8 space-y-2">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={handleNavLinkClick}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-4 rounded-2xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group ${
                          isActive ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' : ''
                        }`
                      }
                    >
                      <span className="text-xl mr-4 group-hover:scale-110 transition-transform duration-200">
                        {link.icon}
                      </span>
                      <span className="font-medium">{link.label}</span>
                    </NavLink>
                  ))}
                </div>

                {/* Mobile Menu Footer */}
                <div className="px-6 py-6 border-t border-gray-200">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Navigation - Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-80 lg:fixed lg:inset-y-0 lg:z-50">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200 shadow-xl">
          {/* Desktop Header */}
          <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-8 mb-8">
              <div 
                className="flex items-center cursor-pointer group"
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
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl mr-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <span className="text-xl font-bold text-white">BB</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                    BetterBooks
                  </h1>
                  <p className="text-sm text-gray-500">Business Finance</p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-6 space-y-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-4 rounded-2xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-600 shadow-sm' 
                        : ''
                    }`
                  }
                >
                  <span className="text-2xl mr-4 group-hover:scale-110 transition-transform duration-200">
                    {link.icon}
                  </span>
                  <span className="font-medium text-lg">{link.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Desktop Footer */}
          <div className="flex-shrink-0 p-6 border-t border-gray-200">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl group"
            >
              <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
