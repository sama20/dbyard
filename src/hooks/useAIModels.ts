// src/hooks/useAIModels.ts
import { useState, useEffect } from 'react';
import { getCopilotUsage, getCopilotSubscription, getUserSettings, saveUserSettings, CopilotUsage, CopilotSubscription, CopilotSettings } from '../services/copilot';
import { useGitHubAuth } from './useGitHubAuth';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  costPerToken: number;
  isAvailable: boolean;
  requiresPremium?: boolean;
  requiresSubscription?: string;
}

export interface Usage {
  tokensUsed: number;
  queriesGenerated: number;
  monthlyLimit: number;
  resetDate: Date;
  currentModel: string;
}

export const useAIModels = () => {
  const { authState, copilotAvailable } = useGitHubAuth();
  
  // Define all possible models
  const allModels: AIModel[] = [
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and efficient, good for most queries',
      maxTokens: 4096,
      costPerToken: 0.002,
      isAvailable: true, // Always available as fallback
      requiresPremium: false
    },
    {
      id: 'copilot',
      name: 'GitHub Copilot',
      description: 'GitHub\'s AI assistant for code and queries',
      maxTokens: 4096,
      costPerToken: 0,
      isAvailable: false, // Will be set based on subscription
      requiresSubscription: 'individual'
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      description: 'Most capable model, best for complex queries',
      maxTokens: 8192,
      costPerToken: 0.03,
      isAvailable: false, // Premium only
      requiresPremium: true,
      requiresSubscription: 'premium'
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      description: 'Excellent reasoning, great for SQL',
      maxTokens: 4096,
      costPerToken: 0.015,
      isAvailable: false, // Premium only
      requiresPremium: true,
      requiresSubscription: 'business'
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      description: 'Balanced performance and speed',
      maxTokens: 4096,
      costPerToken: 0.003,
      isAvailable: false, // Premium only
      requiresPremium: true,
      requiresSubscription: 'premium'
    }
  ];

  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [userTier, setUserTier] = useState<'free' | 'individual' | 'premium' | 'business' | 'enterprise'>('free');
  const [subscriptionData, setSubscriptionData] = useState<CopilotSubscription | null>(null);
  const [usage, setUsage] = useState<Usage>(() => {
    const defaultUsage = {
      tokensUsed: 0,
      queriesGenerated: 0,
      monthlyLimit: 5000,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currentModel: 'gpt-3.5-turbo'
    };

    // If user is not connected, use local storage fallback
    if (!authState.isConnected) {
      const stored = localStorage.getItem('ai_usage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return {
            ...parsed,
            resetDate: new Date(parsed.resetDate)
          };
        } catch {
          // Fallback to default
        }
      }
    }
    
    return defaultUsage;
  });

  const [realUsageData, setRealUsageData] = useState<CopilotUsage | null>(null);

  // Fetch real usage data when user connects to GitHub
  useEffect(() => {
    const fetchRealUsage = async () => {
      if (!authState.isConnected || !authState.accessToken) {
        return;
      }

      try {
        // First, get the user's subscription and available models
        console.log('Fetching Copilot subscription data...');
        const subscription = await getCopilotSubscription(authState.accessToken);
        setSubscriptionData(subscription);
        
        if (subscription) {
          console.log('User subscription:', subscription.subscriptionType, 'Tier:', subscription.userTier);
          setUserTier(subscription.userTier);
          
          // Auto-select appropriate model based on subscription
          const preferredModel = subscription.availableModels.includes('copilot') && subscription.hasActiveSubscription 
            ? 'copilot' 
            : subscription.availableModels[0] || 'gpt-3.5-turbo';
          
          setSelectedModel(preferredModel);
          
          // Now get usage data if they have Copilot
          if (subscription.hasActiveSubscription && subscription.features.codeCompletions) {
            const copilotUsage = await getCopilotUsage(authState.accessToken);
            setRealUsageData(copilotUsage);

            // Update usage based on real data
            if (copilotUsage) {
              const userSettings = getUserSettings(authState.user?.login || null);
              
              setUsage({
                tokensUsed: userSettings.tokensUsed, // Keep local tracking for queries
                queriesGenerated: userSettings.queriesGenerated,
                monthlyLimit: 5000, // Default for display
                resetDate: new Date(copilotUsage.allowanceResetDate),
                currentModel: preferredModel
              });
            }
          } else {
            // User doesn't have Copilot, use fallback
            const userSettings = getUserSettings(authState.user?.login || null);
            setUsage({
              tokensUsed: userSettings.tokensUsed,
              queriesGenerated: userSettings.queriesGenerated,
              monthlyLimit: 5000,
              resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              currentModel: preferredModel
            });
          }
        } else {
          // No subscription data available, fallback to free tier
          console.log('No subscription data available, using free tier');
          setUserTier('free');
          const userSettings = getUserSettings(authState.user?.login || null);
          if (userSettings.preferredModel) {
            setSelectedModel(userSettings.preferredModel);
          }
        }
      } catch (error) {
        console.error('Failed to fetch subscription data:', error);
        // Fallback to user settings
        if (authState.user?.login) {
          const userSettings = getUserSettings(authState.user.login);
          setUsage(prev => ({
            ...prev,
            currentModel: userSettings.preferredModel || prev.currentModel,
            tokensUsed: userSettings.tokensUsed || prev.tokensUsed,
            queriesGenerated: userSettings.queriesGenerated || prev.queriesGenerated
          }));
          
          if (userSettings.preferredModel) {
            setSelectedModel(userSettings.preferredModel);
          }
        }
      }
    };

    fetchRealUsage();
  }, [authState.isConnected, authState.accessToken, authState.user?.login]);

  // Save usage to appropriate storage
  useEffect(() => {
    if (authState.isConnected && authState.user?.login) {
      // Save to user-specific storage
      const userSettings: CopilotSettings = {
        preferredModel: selectedModel,
        tokensUsed: usage.tokensUsed,
        queriesGenerated: usage.queriesGenerated,
        lastUpdated: new Date().toISOString()
      };
      saveUserSettings(authState.user.login, userSettings);
    } else {
      // Fallback to general localStorage for non-authenticated users
      localStorage.setItem('ai_usage', JSON.stringify(usage));
    }
  }, [usage, selectedModel, authState.isConnected, authState.user?.login]);

  const updateUsage = (tokensUsed: number) => {
    console.log('Updating usage with tokens:', tokensUsed);
    
    setUsage(prev => {
      const newUsage = {
        ...prev,
        tokensUsed: prev.tokensUsed + tokensUsed,
        queriesGenerated: prev.queriesGenerated + 1,
        currentModel: selectedModel
      };

      console.log('New usage state:', newUsage);

      // Save immediately for authenticated users
      if (authState.isConnected && authState.user?.login) {
        const userSettings: CopilotSettings = {
          preferredModel: selectedModel,
          tokensUsed: newUsage.tokensUsed,
          queriesGenerated: newUsage.queriesGenerated,
          lastUpdated: new Date().toISOString()
        };
        saveUserSettings(authState.user.login, userSettings);
        console.log('Saved user settings:', userSettings);
      }

      return newUsage;
    });
  };

  const setSelectedModelWithSave = (modelId: string) => {
    setSelectedModel(modelId);
    
    // Save model preference immediately
    if (authState.isConnected && authState.user?.login) {
      const currentSettings = getUserSettings(authState.user.login);
      saveUserSettings(authState.user.login, {
        ...currentSettings,
        preferredModel: modelId
      });
    }
  };

  const getUsagePercentage = () => {
    return Math.min((usage.tokensUsed / usage.monthlyLimit) * 100, 100);
  };

  const getRemainingTokens = () => {
    return Math.max(usage.monthlyLimit - usage.tokensUsed, 0);
  };

  const isUsageLimitReached = () => {
    return usage.tokensUsed >= usage.monthlyLimit;
  };

  const getSelectedModel = () => {
    const availableModels = getAvailableModels();
    return availableModels.find(model => model.id === selectedModel);
  };

  const getAvailableModels = () => {
    return allModels.map(model => {
      // Base availability logic
      let isAvailable = false;
      
      if (model.id === 'gpt-3.5-turbo') {
        // Always available as fallback
        isAvailable = true;
      } else if (subscriptionData) {
        // Use real subscription data to determine availability
        isAvailable = subscriptionData.availableModels.includes(model.id);
      } else if (model.id === 'copilot') {
        // Fallback to old copilotAvailable check
        isAvailable = copilotAvailable;
      }
      
      return {
        ...model,
        isAvailable
      };
    });
  };

  const getDaysUntilReset = () => {
    const now = new Date();
    const diffTime = usage.resetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  return {
    availableModels: getAvailableModels(),
    selectedModel,
    setSelectedModel: setSelectedModelWithSave,
    usage,
    updateUsage,
    getUsagePercentage,
    getRemainingTokens,
    isUsageLimitReached,
    getSelectedModel,
    getDaysUntilReset,
    realUsageData,
    isConnectedToGitHub: authState.isConnected,
    userTier,
    subscriptionData
  };
};
