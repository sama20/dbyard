import React from 'react';
import { X } from 'lucide-react';
import type { QueryTab } from '../types';

interface QueryTabsProps {
  tabs: QueryTab[];
  activeTabId: string;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
}

export default function QueryTabs({ tabs, activeTabId, onTabSelect, onTabClose }: QueryTabsProps) {
  return (
    <div className="flex items-center space-x-1 px-2 overflow-x-auto bg-gray-800 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`group flex items-center space-x-2 px-4 py-2 cursor-pointer border-b-2 transition-colors ${
            activeTabId === tab.id
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          onClick={() => onTabSelect(tab.id)}
        >
          <span className="truncate max-w-xs">{tab.title}</span>
          {tabs.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 transition-opacity"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}