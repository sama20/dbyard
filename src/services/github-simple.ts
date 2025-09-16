// src/services/github-simple.ts
export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  email: string;
}

export interface GitHubAuthState {
  isConnected: boolean;
  user: GitHubUser | null;
  accessToken: string | null;
}

class GitHubService {
  private clientId = 'Ov23liPQhPWfQOYPqhQm';

  getAuthState(): GitHubAuthState {
    const stored = localStorage.getItem('github_auth');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem('github_auth');
      }
    }
    return {
      isConnected: false,
      user: null,
      accessToken: null
    };
  }

  private saveAuthState(state: GitHubAuthState): void {
    localStorage.setItem('github_auth', JSON.stringify(state));
  }

  async signIn(): Promise<void> {
    // For development, we'll use a simplified approach with GitHub device flow
    // In production, you'd want proper OAuth flow with your backend
    
    const username = prompt('Enter your GitHub username to connect:');
    if (!username?.trim()) {
      throw new Error('Username is required');
    }

    try {
      // Get public user info
      const response = await fetch(`https://api.github.com/users/${username.trim()}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('GitHub user not found');
        }
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      const user: GitHubUser = {
        login: userData.login,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        email: userData.email || ''
      };

      // For now, create a demo token - in production you'd get real OAuth token
      const authState: GitHubAuthState = {
        isConnected: true,
        user,
        accessToken: `demo_token_${Date.now()}`
      };

      this.saveAuthState(authState);
      window.dispatchEvent(new CustomEvent('github-auth-success'));
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  signOut(): void {
    localStorage.removeItem('github_auth');
  }

  async checkCopilotStatus(): Promise<boolean> {
    const authState = this.getAuthState();
    return authState.isConnected; // For demo purposes
  }
}

export const githubService = new GitHubService();
