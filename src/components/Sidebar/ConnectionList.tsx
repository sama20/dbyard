import React from 'react';
import { Database, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import type { Connection } from '../../types';

interface ConnectionListProps {
  connections: Connection[];
  loading: { [key: string]: boolean };
  onToggleConnection: (connectionId: string) => void;
  onContextMenu: (e: React.MouseEvent, connectionId: string) => void;
  renderDatabases: (connection: Connection) => React.ReactNode;
}

export const ConnectionList: React.FC<ConnectionListProps> = ({
  connections,
  loading,
  onToggleConnection,
  onContextMenu,
  renderDatabases
}) => (
  <div className="p-2">
    {connections.map(connection => (
      <div 
        key={connection.id} 
        className="mb-2"
        style={{ backgroundColor: connection.color }}
      >
        <div
          onContextMenu={(e) => onContextMenu(e, connection.id)}
          onClick={() => onToggleConnection(connection.id)}
          className="flex items-center space-x-2 p-1 hover:bg-gray-700/50 rounded cursor-pointer group"
        >
          {loading[connection.id] ? (
            <Loader2 size={14} className="text-blue-400 animate-spin" />
          ) : connection.isExpanded ? (
            <ChevronDown size={14} className="text-gray-400" />
          ) : (
            <ChevronRight size={14} className="text-gray-400" />
          )}
          <Database size={14} className="text-blue-400" />
          <span className="text-sm text-gray-200 group-hover:text-white">{connection.name}</span>
        </div>
        {connection.isExpanded && renderDatabases(connection)}
      </div>
    ))}
  </div>
);
