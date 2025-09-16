// src/components/CopilotChat/UsageDisplay.tsx
import React from 'react';
import { BarChart3, Calendar, Zap, Hash } from 'lucide-react';
import { Usage } from '../../hooks/useAIModels';

interface UsageDisplayProps {
  usage: Usage;
  usagePercentage: number;
  remainingTokens: number;
  daysUntilReset: number;
  isLimitReached: boolean;
}

const UsageDisplay: React.FC<UsageDisplayProps> = ({
  usage,
  usagePercentage,
  remainingTokens,
  daysUntilReset,
  isLimitReached
}) => {
  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-red-500';
    if (usagePercentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
      <div className="flex items-center space-x-2 mb-3">
        <BarChart3 size={16} className="text-blue-400" />
        <h4 className="text-sm font-medium text-white">Usage This Month</h4>
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
      </div>
    </div>
  );
};

export default UsageDisplay;
