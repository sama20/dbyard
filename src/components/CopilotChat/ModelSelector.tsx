// src/components/CopilotChat/ModelSelector.tsx
import React, { useState } from 'react';
import { ChevronDown, Zap, Clock, DollarSign, Check } from 'lucide-react';
import { AIModel } from '../../hooks/useAIModels';

interface ModelSelectorProps {
  availableModels: AIModel[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  availableModels,
  selectedModel,
  onModelChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentModel = availableModels.find(model => model.id === selectedModel);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Zap size={14} className="text-blue-400" />
          <span>{currentModel?.name || 'Select Model'}</span>
        </div>
        <ChevronDown 
          size={14} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            {availableModels.map(model => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                }}
                disabled={!model.isAvailable}
                className={`w-full p-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                  !model.isAvailable ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white">
                        {model.name}
                      </span>
                      {selectedModel === model.id && (
                        <Check size={14} className="text-green-400" />
                      )}
                      {!model.isAvailable && (
                        <span className="px-2 py-0.5 bg-yellow-600 text-yellow-100 text-xs rounded">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {model.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock size={10} />
                        <span>{model.maxTokens} tokens</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign size={10} />
                        <span>${model.costPerToken}/token</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ModelSelector;
