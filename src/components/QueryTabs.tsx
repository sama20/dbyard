import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import type { QueryTab } from '../types';

interface QueryTabsProps {
  tabs: QueryTab[];
  activeTabId: string;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
}

export default function QueryTabs({ tabs, activeTabId, onTabSelect, onTabClose }: QueryTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeTab = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeTabId]);

  return (
    <div 
      ref={scrollContainerRef}
      className="flex items-center space-x-1 px-2 overflow-x-auto bg-gray-800 border-b border-gray-700 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      style={{ scrollbarWidth: 'thin' }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          data-active={activeTabId === tab.id}
          className={`group flex items-center space-x-2 px-3 py-1.5 cursor-pointer border-b-2 transition-colors text-sm whitespace-nowrap ${
            activeTabId === tab.id
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => onTabSelect(tab.id)}
        >
          <span className="truncate max-w-[150px]">{tab.title}</span>
          {tabs.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}