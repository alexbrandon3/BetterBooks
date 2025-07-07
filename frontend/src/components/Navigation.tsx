import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navigation = () => {
  const { logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const navLinks = [
    { to: "/", label: "Dashboard", icon: "📊" },
    { to: "/transactions", label: "Transactions", icon: "💰" },
    { to: "/accounts", label: "Accounts", icon: "🏦" },
    { to: "/reports", label: "Reports", icon: "📈" },
    { to: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between shadow-lg">
          <div 
            className="text-xl font-bold cursor-pointer hover:text-gray-300 transition-colors duration-200"
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
          
          {/* Hamburger Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200"
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
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div 
              className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="p-6 border-b border-gray-700 bg-gray-900">
                  <div className="text-2xl font-bold text-white">BetterBooks</div>
                  <div className="text-sm text-gray-400 mt-1">Business Finance Manager</div>
                </div>

                {/* Mobile Menu Links */}
                <div className="flex-grow p-4 space-y-2">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={handleNavLinkClick}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-4 rounded-lg transition-all duration-200 font-medium text-lg ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-md"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`
                      }
                    >
                      <span className="mr-3 text-xl">{link.icon}</span>
                      {link.label}
                    </NavLink>
                  ))}
                </div>

                {/* Mobile Logout Button */}
                <div className="p-4 border-t border-gray-700">
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-4 rounded-lg transition-all duration-200 font-medium text-lg text-gray-300 hover:bg-red-600 hover:text-white"
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex min-h-screen w-64 bg-gray-800 text-white flex-col shadow-lg">
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
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <span className="mr-3">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>
        
        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="w-full px-4 py-3 rounded-lg transition-all duration-200 font-medium text-gray-300 hover:bg-red-600 hover:text-white"
          >
            🚪 Logout
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
