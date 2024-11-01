import React from 'react';
import { Play, RefreshCw, Terminal, Plus } from 'lucide-react';
import { Connection, QueryTab } from '../types';

interface ToolbarProps {
  connections: Connection[];
  activeTab: QueryTab;
  onConnectionChange: (connectionId: string) => void;
  onDatabaseChange: (database: string) => void;
}

export default function Toolbar({ connections, activeTab, onConnectionChange, onDatabaseChange }: ToolbarProps) {
  const activeConnection = connections.find(c => c.id === activeTab.connectionId);
  const databases = activeConnection?.databases?.map(db => db.name) || [];

  return (
    <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 space-x-2 shrink-0"
         style={{ backgroundColor: activeConnection?.color ? `${activeConnection.color}20` : undefined }}>
      <select
        value={activeTab.connectionId || ''}
        onChange={(e) => onConnectionChange(e.target.value)}
        className="h-7 bg-gray-700 border border-gray-600 rounded text-gray-200 text-xs px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select Connection</option>
        {connections.map(conn => (
          <option key={conn.id} value={conn.id}>{conn.name}</option>
        ))}
      </select>
      
      <select
        value={activeTab.database || ''}
        onChange={(e) => onDatabaseChange(e.target.value)}
        className="h-7 bg-gray-700 border border-gray-600 rounded text-gray-200 text-xs px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select Database</option>
        {databases.map(db => (
          <option key={db} value={db}>{db}</option>
        ))}
      </select>

      <button className="p-1.5 hover:bg-gray-700 rounded text-green-400 hover:text-green-300 transition-colors" title="Execute Query">
        <Play size={18} />
      </button>
      <button className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors" title="Refresh">
        <RefreshCw size={18} />
      </button>
      <div className="h-5 w-px bg-gray-700 mx-2" />
      <button className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors" title="Open Console">
        <Terminal size={18} />
      </button>
      <button className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors" title="New Query">
        <Plus size={18} />
      </button>
    </div>
  );
}