import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { QueryTab } from '../types';

interface QueryTabsProps {
  tabs: QueryTab[];
  activeTabId: string;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
}

export default function QueryTabs({ tabs, activeTabId, onTabSelect, onTabClose }: QueryTabsProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const container = containerRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount);
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const handleScroll = () => {
    if (containerRef.current) {
      setScrollPosition(containerRef.current.scrollLeft);
    }
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = containerRef.current 
    ? scrollPosition < containerRef.current.scrollWidth - containerRef.current.clientWidth
    : false;

  return (
    <div className="flex items-center bg-gray-800 border-b border-gray-700">
      {canScrollLeft && (
        <button 
          onClick={() => scroll('left')}
          className="px-1 h-full hover:bg-gray-700 text-gray-400 hover:text-gray-200"
        >
          <ChevronLeft size={14} />
        </button>
      )}
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex items-center space-x-1 px-2 overflow-x-hidden bg-gray-800"
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
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

      {canScrollRight && (
        <button 
          onClick={() => scroll('right')}
          className="px-1 h-full hover:bg-gray-700 text-gray-400 hover:text-gray-200"
        >
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}