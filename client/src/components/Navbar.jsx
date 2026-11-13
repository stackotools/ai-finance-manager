import React from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {user && (
              <button
                type="button"
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={onMenuClick}
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            )}
            <div className="flex-shrink-0 flex items-center ml-4 md:ml-0">
              <Link to={user ? "/" : "/landing"} className="text-xl font-bold text-indigo-600">
                FinanceAI
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/profile" className="hidden sm:flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                  <User className="h-5 w-5 text-gray-400" />
                  <span>{user.name || 'User'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 p-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <LogOut className="h-5 w-5 text-gray-400" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2">
                  Log in
                </Link>
                <Link to="/signup" className="text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
