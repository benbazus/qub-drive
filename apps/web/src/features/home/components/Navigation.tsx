import React, { useMemo } from 'react';
import { Cloud, Menu, X } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import Button from './Button';

import { useAuthUser, useIsAuthenticated, useLogout } from '@/stores/authStore';

// Define user type for type safety
interface User {
  email?: string;
}

interface NavigationProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ isMenuOpen, toggleMenu }) => {
  const navigate = useNavigate();
  const user = useAuthUser() as User | null;
  const isAuthenticated = useIsAuthenticated();
  const logout = useLogout();

  // Memoize navLinks to prevent unnecessary re-creation
  const navLinks = useMemo(
    () => [
      { to: '#features', label: 'Features' },
      { to: '#pricing', label: 'Pricing' },
      { to: '#testimonials', label: 'Reviews' },
      { to: '#about', label: 'About' },
    ],
    []
  );

  const handleNavClick = (to: string) => {
    navigate({ to });
    if (isMenuOpen) toggleMenu(); // Close mobile menu after navigation
  };

  const handleLogout = () => {
    logout();
    navigate({ to: '/' }); // Redirect to home after logout
    if (isMenuOpen) toggleMenu();
  };

  return (
    <nav
      role="navigation"
      className="fixed top-0 z-50 w-full border-b backdrop-blur-md border-gray-200 bg-white/80"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-2">
              <Cloud className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
              Qub Drive
            </span>
          </div>
          <div className="hidden items-center space-x-8 md:flex">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.to}
                onClick={() => handleNavClick(link.to)}
                className="transition-colors hover:text-blue-500 text-gray-600"
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && user?.email && (
              <p className="text-sm text-gray-500">
                Welcome back, {user.email}!
              </p>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
                <Button
                  onClick={handleLogout}
                  className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Log Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => navigate({ to: '/sign-in' })}
                  className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate({ to: '/sign-up' })}
                  className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-white transition-colors hover:shadow-lg"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
          <Button
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="ml-2 rounded-lg md:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
        {isMenuOpen && (
          <div className="border-t border-gray-200 py-4 md:hidden">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link, idx) => (
                <Link
                  key={idx}
                  to={link.to}
                  onClick={() => handleNavClick(link.to)}
                  className="transition-colors hover:text-blue-500 text-gray-600"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && user?.email && (
                <p className="text-sm text-gray-500">
                  Welcome back, {user.email}!
                </p>
              )}
              {isAuthenticated ? (
                <div className="flex flex-col space-y-4">
                  <Link
                    to="/dashboard"
                    onClick={toggleMenu}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                  <Button
                    onClick={handleLogout}
                    className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Log Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <Button
                    onClick={() => {
                      navigate({ to: '/sign-in' });
                      toggleMenu();
                    }}
                    className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => {
                      navigate({ to: '/sign-up' });
                      toggleMenu();
                    }}
                    className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-white transition-colors hover:shadow-lg"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;