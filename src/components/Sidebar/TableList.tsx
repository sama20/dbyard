import React from 'react';
import { Table2 } from 'lucide-react';
import type { Connection } from '../../types';

interface TableListProps {
  connection: Connection;
  dbName: string;
  tables: string[];
  onTableClick: (connection: Connection, dbName: string, table: string) => void;
  onTableContextMenu: (e: React.MouseEvent, connection: Connection, dbName: string, table: string) => void;
}

export const TableList: React.FC<TableListProps> = ({
  connection,
  dbName,
  tables,
  onTableClick,
  onTableContextMenu
}) => (
  <div className="ml-8">
    {tables.map(table => (
      <div
        key={table}
        onClick={() => onTableClick(connection, dbName, table)}
        onContextMenu={(e) => onTableContextMenu(e, connection, dbName, table)}
        className="flex items-center space-x-2 p-1 hover:bg-gray-700/50 rounded cursor-pointer group"
      >
        <Table2 size={14} className="text-blue-400" />
        <span style={{ minWidth: 14, minHeight: 14 }} className="text-xs text-gray-300 group-hover:text-white">{table}</span>
      </div>
    ))}
  </div>
);
