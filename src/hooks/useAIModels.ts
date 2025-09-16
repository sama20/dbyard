// src/hooks/useAIModels.ts
import { useState, useEffect } from 'react';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  costPerToken: number;
  isAvailable: boolean;
}

export interface Usage {
  tokensUsed: number;
  queriesGenerated: number;
  monthlyLimit: number;
  resetDate: Date;
  currentModel: string;
}

export const useAIModels = () => {
  const [availableModels] = useState<AIModel[]>([
    {
      id: 'gpt-4',
      name: 'GPT-4',
      description: 'Most capable model, best for complex queries',
      maxTokens: 8192,
      costPerToken: 0.03,
      isAvailable: true
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and efficient, good for most queries',
      maxTokens: 4096,
      costPerToken: 0.002,
      isAvailable: true
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      description: 'Excellent reasoning, great for SQL',
      maxTokens: 4096,
      costPerToken: 0.015,
      isAvailable: true
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      description: 'Balanced performance and speed',
      maxTokens: 4096,
      costPerToken: 0.003,
      isAvailable: true
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      description: 'Google\'s powerful model',
      maxTokens: 2048,
      costPerToken: 0.001,
      isAvailable: false // Premium feature
    }
  ]);

  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [usage, setUsage] = useState<Usage>(() => {
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
    
    // Default usage for new users
    return {
      tokensUsed: 1250,
      queriesGenerated: 15,
      monthlyLimit: 5000,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      currentModel: 'gpt-3.5-turbo'
    };
  });

  // Save usage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ai_usage', JSON.stringify(usage));
  }, [usage]);

  const updateUsage = (tokensUsed: number) => {
    setUsage(prev => ({
      ...prev,
      tokensUsed: prev.tokensUsed + tokensUsed,
      queriesGenerated: prev.queriesGenerated + 1,
      currentModel: selectedModel
    }));
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
    return availableModels.find(model => model.id === selectedModel);
  };

  const getDaysUntilReset = () => {
    const now = new Date();
    const diffTime = usage.resetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  return {
    availableModels,
    selectedModel,
    setSelectedModel,
    usage,
    updateUsage,
    getUsagePercentage,
    getRemainingTokens,
    isUsageLimitReached,
    getSelectedModel,
    getDaysUntilReset
  };
};
