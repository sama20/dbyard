// src/components/CopilotChat/UsageDisplay.tsx
import React from 'react';
import { BarChart3, Calendar, Zap, Hash, Wifi, WifiOff, User, Code, MessageSquare, Crown } from 'lucide-react';
import { Usage } from '../../hooks/useAIModels';
import { CopilotUsage } from '../../services/copilot';

interface UsageDisplayProps {
  usage: Usage;
  usagePercentage: number;
  remainingTokens: number;
  daysUntilReset: number;
  isLimitReached: boolean;
  isConnectedToGitHub?: boolean;
  realUsageData?: CopilotUsage | null;
}

const UsageDisplay: React.FC<UsageDisplayProps> = ({
  usage,
  usagePercentage,
  remainingTokens,
  daysUntilReset,
  isLimitReached,
  isConnectedToGitHub = false,
  realUsageData
}) => {
  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-red-500';
    if (usagePercentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getDataSourceIcon = () => {
    if (isConnectedToGitHub && realUsageData) {
      return <Wifi size={12} className="text-green-400" />;
    } else if (isConnectedToGitHub) {
      return <User size={12} className="text-blue-400" />;
    } else {
      return <WifiOff size={12} className="text-gray-400" />;
    }
  };

  const getDataSourceText = () => {
    if (isConnectedToGitHub && realUsageData) {
      return "Copilot Usage";
    } else if (isConnectedToGitHub) {
      return "User Data";
    } else {
      return "Local Data";
    }
  };

  const formatResetDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // If we have real Copilot data, show VS Code-style format
  if (isConnectedToGitHub && realUsageData && realUsageData.hasActiveSubscription) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 size={16} className="text-blue-400" />
            <h4 className="text-sm font-medium text-white">Copilot Usage</h4>
          </div>
          <div className="flex items-center space-x-1">
            {getDataSourceIcon()}
            <span className="text-xs text-gray-400">Live Data</span>
          </div>
        </div>

        {/* Copilot Features */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code size={14} className="text-green-400" />
              <span className="text-sm text-gray-300">Code completions</span>
            </div>
            <span className="text-sm text-green-400 font-medium">
              {realUsageData.codeCompletions}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare size={14} className="text-blue-400" />
              <span className="text-sm text-gray-300">Chat messages</span>
            </div>
            <span className="text-sm text-green-400 font-medium">
              {realUsageData.chatMessages}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown size={14} className="text-purple-400" />
              <span className="text-sm text-gray-300">Premium requests</span>
            </div>
            <span className="text-sm text-white font-medium">
              {realUsageData.premiumRequests.percentage}
            </span>
          </div>

          {realUsageData.premiumRequests.disabled && (
            <p className="text-xs text-orange-400">
              Additional paid premium requests disabled.
            </p>
          )}
        </div>

        {/* Reset Date */}
        <div className="pt-3 border-t border-gray-700">
          <div className="flex items-center space-x-2 mb-1">
            <Calendar size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400">Allowance resets</span>
          </div>
          <span className="text-sm text-white">
            {formatResetDate(realUsageData.allowanceResetDate)}
          </span>
        </div>

        {/* Workspace Index */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-1">Workspace Index</div>
          <div className="text-sm text-white">{realUsageData.workspaceIndex}</div>
        </div>
      </div>
    );
  }

  // Fallback to generic usage display for non-Copilot users
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <BarChart3 size={16} className="text-blue-400" />
          <h4 className="text-sm font-medium text-white">Usage This Month</h4>
        </div>
        <div className="flex items-center space-x-1">
          {getDataSourceIcon()}
          <span className="text-xs text-gray-400">{getDataSourceText()}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>{formatNumber(usage.tokensUsed)} / {formatNumber(usage.monthlyLimit)} tokens</span>
          <span>{usagePercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        {isLimitReached && (
          <p className="text-xs text-red-400 mt-1">
            ⚠️ Monthly limit reached
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-gray-900 p-2 rounded">
          <div className="flex items-center space-x-1 text-gray-400 mb-1">
            <Hash size={10} />
            <span>Queries</span>
          </div>
          <span className="text-white font-medium">{formatNumber(usage.queriesGenerated)}</span>
        </div>

        <div className="bg-gray-900 p-2 rounded">
          <div className="flex items-center space-x-1 text-gray-400 mb-1">
            <Zap size={10} />
            <span>Remaining</span>
          </div>
          <span className="text-white font-medium">{formatNumber(remainingTokens)}</span>
        </div>

        <div className="bg-gray-900 p-2 rounded col-span-2">
          <div className="flex items-center space-x-1 text-gray-400 mb-1">
            <Calendar size={10} />
            <span>Resets in</span>
          </div>
          <span className="text-white font-medium">
            {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>

      {/* Current Model */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-1">Current Model</div>
        <div className="text-sm text-white font-medium">{usage.currentModel}</div>
        {usage.currentModel === 'copilot' && isConnectedToGitHub && (
          <div className="text-xs text-green-400 mt-1">✓ GitHub Copilot Active</div>
        )}
      </div>

      {/* Connection Status */}
      {!isConnectedToGitHub && (
        <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-600/50 rounded text-xs text-yellow-300">
          💡 Connect to GitHub for real usage data and Copilot access
        </div>
      )}
    </div>
  );
};

export default UsageDisplay;
