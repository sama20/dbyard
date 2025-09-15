import React from 'react';
import { Database, Plus, ChevronLeftCircle, ChevronRightCircle } from 'lucide-react';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onCollapseToggle: () => void;
  onAddConnection: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed,
  onCollapseToggle,
  onAddConnection
}) => (
  <div className="p-2 border-b border-gray-700 flex items-center justify-between">
    {!isCollapsed && (
      <>
        <div className="flex items-center space-x-2">
          <Database size={18} className="text-blue-400" />
          <span className="font-medium text-sm text-gray-100">Connections</span>
        </div>
        <button
          onClick={onAddConnection}
          className="p-1 hover:bg-gray-700 rounded-md transition-colors"
          title="Add Connection"
        >
          <Plus size={14} className="text-gray-300 hover:text-white" />
        </button>
      </>
    )}
    <button
      onClick={onCollapseToggle}
      className="p-1 hover:bg-gray-700 rounded-md transition-colors ml-auto"
      title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
    >
      {isCollapsed ? (
        <ChevronRightCircle size={14} className="text-gray-300 hover:text-white" />
      ) : (
        <ChevronLeftCircle size={14} className="text-gray-300 hover:text-white" />
      )}
    </button>
  </div>
);
