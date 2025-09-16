// src/components/CopilotChat/AddContextButton.tsx
import React from 'react';
import { Plus, Database, Table } from 'lucide-react';

interface AddContextButtonProps {
  onAddDatabaseContext: (dbName: string, connection: string) => void;
  onAddTableContext: (tableName: string, connection: string, columns?: any[]) => void;
  tableName?: string;
  databaseName?: string;
  connectionName?: string;
  className?: string;
}

const AddContextButton: React.FC<AddContextButtonProps> = ({
  onAddDatabaseContext,
  onAddTableContext,
  tableName,
  databaseName,
  connectionName = 'default',
  className = ''
}) => {
  const handleAddContext = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (tableName) {
      onAddTableContext(tableName, connectionName);
    } else if (databaseName) {
      onAddDatabaseContext(databaseName, connectionName);
    }
  };

  if (!tableName && !databaseName) return null;

  return (
    <button
      onClick={handleAddContext}
      className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-green-400 transition-all ${className}`}
      title={`Add ${tableName ? 'table' : 'database'} to Copilot context`}
    >
      <div className="flex items-center space-x-1">
        <Plus size={12} />
        {tableName ? <Table size={12} /> : <Database size={12} />}
      </div>
    </button>
  );
};

export default AddContextButton;
