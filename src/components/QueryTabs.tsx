import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { QueryTab } from '../types';

interface QueryTabsProps {
  tabs: QueryTab[];
  activeTabId: string;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
}

export default function QueryTabs({ tabs, activeTabId, onTabSelect, onTabClose }: QueryTabsProps) {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const tabsContainerRef = React.useRef<HTMLDivElement>(null);

  const checkArrows = () => {
    const container = tabsContainerRef.current;
    if (container) {
      setShowLeftArrow(container.scrollLeft > 0);
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  };

  useEffect(() => {
    checkArrows();
    window.addEventListener('resize', checkArrows);
    return () => window.removeEventListener('resize', checkArrows);
  }, [tabs]);

  const scroll = (direction: 'left' | 'right') => {
    const container = tabsContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkArrows, 300);
    }
  };

  const handleScroll = () => {
    checkArrows();
  };

  return (
    <div className="h-7 flex bg-gray-800/80 border-b border-gray-700/80 backdrop-blur-sm">
      <button
        onClick={() => scroll('left')}
        className={`w-6 flex-none flex items-center justify-center border-r border-gray-700/50 transition-colors ${
          showLeftArrow 
            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 cursor-pointer' 
            : 'text-gray-600/50 cursor-default'
        }`}
        disabled={!showLeftArrow}
        type="button"
      >
        <ChevronLeft size={12} />
      </button>
      


      <div className="relative rounded-xl overflow-auto">
        <div className="max-w-screen-md mx-auto  dark:bg-slate-800 dark:highlight-white/5">
        <div
        ref={tabsContainerRef}
        onScroll={handleScroll}
        className="overflow-x-auto flex"
      >
        <div className="flex h-full ">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center gap-1.5 px-2.5 min-w-[100px] max-w-[160px] cursor-pointer border-r border-gray-700/50 transition-all duration-150 hover:bg-gray-700/30 ${
                activeTabId === tab.id
                  ? 'bg-gray-700/40 text-gray-100'
                  : 'text-gray-400'
              }`}
              onClick={() => onTabSelect(tab.id)}
            >
              <span className="truncate flex-1 text-[11px] font-medium py-1.5">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-150 flex-none p-0.5 rounded-sm hover:bg-gray-600/30"
                  type="button"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>
      </div>
      
      <button
        onClick={() => scroll('right')}
        className={`w-6 flex-none flex items-center justify-center border-l border-gray-700/50 transition-colors ${
          showRightArrow 
            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 cursor-pointer' 
            : 'text-gray-600/50 cursor-default'
        }`}
        disabled={!showRightArrow}
        type="button"
      >
        <ChevronRight size={12} />
      </button>
    </div>
  );
}