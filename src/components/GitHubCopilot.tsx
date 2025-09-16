// src/components/GitHubCopilot.tsx
import React, { useState } from 'react';
import { Bot, User, LogOut, Loader2 } from 'lucide-react';
import { useGitHubAuth } from '../hooks/useGitHubAuth';

const GitHubCopilot: React.FC = () => {
  const { authState, isLoading, copilotAvailable, signIn, signOut } = useGitHubAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleConnect = () => {
    if (!authState.isConnected) {
      signIn();
    }
  };

  const handleSignOut = () => {
    signOut();
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      {authState.isConnected ? (
        <div className="flex items-center space-x-2">
          {/* GitHub Copilot Icon - Green when connected */}
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 p-1 hover:bg-gray-700 rounded text-green-400 hover:text-green-300 transition-colors"
            title={`GitHub Copilot - Connected as ${authState.user?.login}`}
          >
            <Bot size={16} className="text-green-400" />
            {copilotAvailable && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </button>

          {/* User info */}
          <div className="flex items-center space-x-1 text-xs text-gray-300">
            <User size={12} />
            <span>{authState.user?.login}</span>
          </div>

          {/* Dropdown menu */}
          {showDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50 min-w-48">
              <div className="p-3 border-b border-gray-600">
                <div className="flex items-center space-x-2">
                  {authState.user?.avatar_url ? (
                    <img 
                      src={authState.user.avatar_url} 
                      alt={authState.user.login}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <User size={16} />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-white">
                      {authState.user?.name || authState.user?.login}
                    </div>
                    <div className="text-xs text-gray-400">
                      @{authState.user?.login}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-2">
                <div className="flex items-center space-x-2 text-xs text-gray-300 mb-2">
                  <Bot size={12} className="text-green-400" />
                  <span>
                    GitHub Copilot: {copilotAvailable ? 'Active' : 'Ready'}
                  </span>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded"
                >
                  <LogOut size={12} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* GitHub Copilot Icon - Gray when disconnected */
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="flex items-center space-x-1 p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
          title="Connect to GitHub Copilot - Just like in VS Code!"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Bot size={16} />
          )}
          {!isLoading && (
            <span className="text-xs">Connect</span>
          )}
        </button>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default GitHubCopilot;
