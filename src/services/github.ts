// src/services/github.ts
import { CopilotToken } from './copilot';

// Check if we're running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};
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
  private clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  private backendUrl = 'http://localhost:3001'; // Our backend proxy

  getAuthState(): GitHubAuthState {
    const stored = localStorage.getItem('github_auth');
    if (stored) {
      try {
        const state = JSON.parse(stored);
        return state;
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
    try {
      if (isElectron()) {
        // Use Electron API for GitHub authentication
        const deviceCodeData = await window.electronAPI.githubRequest('/device/code', {
          method: 'POST',
          body: { scope: 'read:user' }
        });

        const { device_code, user_code, verification_uri, interval } = deviceCodeData;

        // Prompt user to authorize
        alert(`Please go to ${verification_uri} and enter the code: ${user_code}`);

        // Poll for the access token
        let tokenData;
        while (true) {
          await new Promise(resolve => setTimeout(resolve, interval * 1000));

          tokenData = await window.electronAPI.githubRequest('/login/oauth/access_token', {
            method: 'POST',
            body: { device_code: device_code }
          });

          if (tokenData.error) {
            if (tokenData.error === 'authorization_pending') {
              continue; // Poll again
            }
            throw new Error(tokenData.error_description || 'Failed to get access token');
          }
          break; // Success
        }

        const { access_token } = tokenData;

        // Get user info with the new token
        const userData = await window.electronAPI.githubRequest('/user', {
          headers: { 'Authorization': `token ${access_token}` }
        });

        const user: GitHubUser = {
          login: userData.login,
          name: userData.name || userData.login,
          avatar_url: userData.avatar_url,
          email: userData.email || ''
        };

        const authState: GitHubAuthState = {
          isConnected: true,
          user,
          accessToken: access_token
        };

        this.saveAuthState(authState);
        window.dispatchEvent(new CustomEvent('github-auth-success'));
        return;
      }

      // Fallback to server proxy for web version
      // 1. Get device code from our proxy
      const deviceCodeResponse = await fetch(`${this.backendUrl}/api/github/device/code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ scope: 'read:user' })
      });

      if (!deviceCodeResponse.ok) {
        throw new Error('Failed to get device code from proxy');
      }

      const deviceCodeData = await deviceCodeResponse.json();
      const { device_code, user_code, verification_uri, interval } = deviceCodeData;

      // 2. Prompt user to authorize
      alert(`Please go to ${verification_uri} and enter the code: ${user_code}`);

      // 3. Poll for the access token via our proxy
      let tokenData;
      while (true) {
        await new Promise(resolve => setTimeout(resolve, interval * 1000));

        const tokenResponse = await fetch(`${this.backendUrl}/api/github/login/oauth/access_token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            device_code: device_code,
          })
        });

        tokenData = await tokenResponse.json();
        if (tokenData.error) {
          if (tokenData.error === 'authorization_pending') {
            continue; // Poll again
          }
          throw new Error(tokenData.error_description || 'Failed to get access token');
        }
        break; // Success
      }

      const { access_token } = tokenData;

      // 4. Get user info with the new token via our proxy
      const userResponse = await fetch(`${this.backendUrl}/api/github/user`, {
        headers: {
          'Authorization': `token ${access_token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data from proxy');
      }

      const userData = await userResponse.json();
      const user: GitHubUser = {
        login: userData.login,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        email: userData.email || ''
      };

      const authState: GitHubAuthState = {
        isConnected: true,
        user,
        accessToken: access_token
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
    if (!authState.isConnected || !authState.accessToken) {
      return false;
    }

    try {
      // Use the Copilot service, which now also goes through the proxy
      const copilotToken = await CopilotToken(authState.accessToken);
      return !!copilotToken;
    } catch (error) {
      console.error('Error checking Copilot status:', error);
      return false;
    }
  }
}

export const githubService = new GitHubService();
