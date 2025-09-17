// src/services/copilot.ts

export interface CopilotSubscription {
  hasActiveSubscription: boolean;
  subscriptionType: 'none' | 'individual' | 'business' | 'enterprise';
  userTier: 'free' | 'individual' | 'premium' | 'business' | 'enterprise';
  availableModels: string[];
  features: {
    codeCompletions: boolean;
    chatMessages: boolean;
    premiumModels: boolean;
  };
  user: {
    login: string;
    plan: string;
    company: string | null;
    publicRepos: number;
    followers: number;
  };
}

export interface CopilotUsage {
  // VS Code Copilot format
  codeCompletions: string;
  chatMessages: string;
  premiumRequests: {
    used: number;
    percentage: string;
    disabled: boolean;
  };
  allowanceResetDate: string;
  workspaceIndex: string;
  billingCycle: string;
  hasActiveSubscription: boolean;
  subscriptionType: string;
  userTier: 'free' | 'individual' | 'premium' | 'business' | 'enterprise';
}

export interface CopilotSettings {
  preferredModel?: string;
  tokensUsed: number;
  queriesGenerated: number;
  lastUpdated: string;
}

export const CopilotToken = async (githubToken: string): Promise<string | null> => {
    if (!githubToken) {
      throw new Error('GitHub token is required');
    }
  
    try {
      console.log('Requesting Copilot token...');
      
      // This request now goes to our backend proxy
      const response = await fetch('http://localhost:3001/api/copilot_internal/token', {
        headers: {
          'Authorization': `token ${githubToken}`
        }
      });
  
      console.log('Copilot token response status:', response.status);
      
      if (response.status === 401) {
        // The proxy will return 401 if the user doesn't have Copilot
        console.log('User does not have a Copilot subscription.');
        return null;
      }
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Copilot token error:', errorData);
        throw new Error(`Failed to fetch Copilot token from proxy. Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Copilot token received successfully');
      return data.token;
  
    } catch (error) {
      console.error('Error fetching Copilot token:', error);
      throw error;
    }
  };

export const getCopilotSubscription = async (githubToken: string): Promise<CopilotSubscription | null> => {
  if (!githubToken) {
    return null;
  }

  try {
    console.log('Requesting Copilot subscription data...');
    
    const response = await fetch('http://localhost:3001/api/copilot/subscription', {
      headers: {
        'Authorization': `token ${githubToken}`
      }
    });

    console.log('Copilot subscription response status:', response.status);

    if (response.status === 401 || response.status === 404) {
      console.log('User does not have valid GitHub access');
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Copilot subscription error:', errorData);
      throw new Error(`Failed to fetch Copilot subscription: ${response.status}`);
    }

    const data = await response.json();
    console.log('Copilot subscription data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching Copilot subscription:', error);
    return null;
  }
};

export const getCopilotUsage = async (githubToken: string): Promise<CopilotUsage | null> => {
  if (!githubToken) {
    return null;
  }

  try {
    console.log('Requesting Copilot usage data...');
    
    const response = await fetch('http://localhost:3001/api/copilot/usage', {
      headers: {
        'Authorization': `token ${githubToken}`
      }
    });

    console.log('Copilot usage response status:', response.status);

    if (response.status === 401 || response.status === 404) {
      // User doesn't have Copilot or endpoint not available
      console.log('User does not have Copilot or data not available');
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Copilot usage error:', errorData);
      throw new Error(`Failed to fetch Copilot usage: ${response.status}`);
    }

    const data = await response.json();
    console.log('Copilot usage data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching Copilot usage:', error);
    return null;
  }
};

export const getUserSettings = (githubUserId: string | null): CopilotSettings => {
  if (!githubUserId) {
    return {
      tokensUsed: 0,
      queriesGenerated: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  const stored = localStorage.getItem(`copilot_settings_${githubUserId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback to default
    }
  }

  return {
    tokensUsed: 0,
    queriesGenerated: 0,
    lastUpdated: new Date().toISOString()
  };
};

export const saveUserSettings = (githubUserId: string, settings: CopilotSettings): void => {
  if (!githubUserId) return;
  
  localStorage.setItem(`copilot_settings_${githubUserId}`, JSON.stringify({
    ...settings,
    lastUpdated: new Date().toISOString()
  }));
};
  