import React from 'react';
import { FolderOpen, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import type { Connection } from '../../types';

interface DatabaseListProps {
  connection: Connection;
  loading: { [key: string]: boolean };
  onToggleDatabase: (connectionId: string, dbName: string) => void;
  renderTables: (connection: Connection, dbName: string) => React.ReactNode;
}

export const DatabaseList: React.FC<DatabaseListProps> = ({
  connection,
  loading,
  onToggleDatabase,
  renderTables
}) => (
  <>
    {connection.databases?.map(db => (
      <div key={db.name} className="ml-4">
        <div
          onClick={() => onToggleDatabase(connection.id, db.name)}
          className="flex items-center space-x-2 p-1 hover:bg-gray-700/50 rounded cursor-pointer group"
        >
          {loading[`${connection.id}-${db.name}`] ? (
            <Loader2 size={14} className="text-yellow-500 animate-spin" />
          ) : db.isExpanded ? (
            <ChevronDown size={14} className="text-gray-400" />
          ) : (
            <ChevronRight size={14} className="text-gray-400" />
          )}
          <FolderOpen size={14} className="text-yellow-600" />
          <span style={{ minWidth: 14, minHeight: 14 }} className="text-xs text-gray-300 group-hover:text-white">{db.name}</span>
        </div>
        {db.isExpanded && renderTables(connection, db.name)}
      </div>
    ))}
  </>
);
