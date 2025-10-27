
import React from 'react';
import { ImageIcon, MenuIcon, GoogleIcon } from './icons';
import type { User } from '../services/authService';

interface HeaderProps {
  onToggleSidebar: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, user, onSignIn, onSignOut }) => {
  return (
    <header className="flex-shrink-0 px-4 md:px-6 lg:px-8 py-4 border-b border-gray-700/50 flex items-center justify-between sticky top-0 z-20 bg-gray-900/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <ImageIcon className="w-8 h-8 text-indigo-400" />
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">
          AI Image Studio
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right text-sm hidden sm:block">
              <div className="font-medium text-gray-200">{user.name}</div>
              <div className="text-xs text-gray-400">API Requests: {user.apiCount}</div>
            </div>
            <img src={user.picture} alt="User" className="w-10 h-10 rounded-full bg-gray-700" />
            <button
              onClick={onSignOut}
              className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all bg-gray-700 text-gray-200 hover:bg-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-indigo-500"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold rounded-md transition-all
                       bg-white text-gray-800
                       hover:bg-gray-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-white"
          >
            <GoogleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Sign in with Google</span>
          </button>
        )}
        <button 
          onClick={onToggleSidebar} 
          className="lg:hidden p-2 -mr-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};
