// src/hooks/useGitHubAuth.ts
import { useState, useEffect } from 'react';
import { githubService, GitHubAuthState } from '../services/github';

export const useGitHubAuth = () => {
  const [authState, setAuthState] = useState<GitHubAuthState>({
    isConnected: false,
    user: null,
    accessToken: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [copilotAvailable, setCopilotAvailable] = useState(false);

  useEffect(() => {
    // Load initial auth state
    const initialState = githubService.getAuthState();
    setAuthState(initialState);

    // Check Copilot availability if connected
    if (initialState.isConnected) {
      checkCopilotStatus();
    }

    // Listen for successful authentication
    const handleAuthSuccess = () => {
      const newState = githubService.getAuthState();
      setAuthState(newState);
      if (newState.isConnected) {
        checkCopilotStatus();
      }
    };

    window.addEventListener('github-auth-success', handleAuthSuccess);
    
    return () => {
      window.removeEventListener('github-auth-success', handleAuthSuccess);
    };
  }, []);

  const checkCopilotStatus = async () => {
    try {
      const available = await githubService.checkCopilotStatus();
      setCopilotAvailable(available);
    } catch (error) {
      console.error('Error checking Copilot status:', error);
      setCopilotAvailable(false);
    }
  };

  const signIn = async () => {
    setIsLoading(true);
    try {
      await githubService.signIn();
      const newState = githubService.getAuthState();
      setAuthState(newState);
      checkCopilotStatus();
    } catch (error) {
      console.error('Sign in error:', error);
      alert(`Authentication failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    githubService.signOut();
    setAuthState({
      isConnected: false,
      user: null,
      accessToken: null
    });
    setCopilotAvailable(false);
  };

  return {
    authState,
    isLoading,
    copilotAvailable,
    signIn,
    signOut
  };
};
