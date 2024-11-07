import React, { useState, useCallback } from 'react';
import { Database, Table2, FolderOpen, Plus, ChevronRight, ChevronDown, Loader2, ChevronLeftCircle, ChevronRightCircle } from 'lucide-react';
import ConnectionModal from './ConnectionModal';
import ColorPicker from './ColorPicker';
import TableContextMenu from './TableContextMenu';
import { fetchDatabases, fetchTables, executeQuery } from '../services/mysql';
import { useConnections } from '../hooks/useConnections';
import type { Connection, ConnectionData } from '../types';
import toast from 'react-hot-toast';

interface SidebarProps {
  onTableClick: (connection: Connection, database: string, table: string) => Promise<void>;
  connections: Connection[];
}

const COLORS = [
  { label: 'Blue', value: 'rgba(59, 130, 246, 0.1)' },
  { label: 'Green', value: 'rgba(16, 185, 129, 0.1)' },
  { label: 'Red', value: 'rgba(239, 68, 68, 0.1)' },
  { label: 'Purple', value: 'rgba(139, 92, 246, 0.1)' },
  { label: 'Yellow', value: 'rgba(245, 158, 11, 0.1)' },
  { label: 'None', value: '' }
];

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  connection?: Connection;
  database?: string;
  table?: string;
}

export default function Sidebar({ onTableClick }: SidebarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { connections, setConnections } = useConnections();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [colorPickerState, setColorPickerState] = useState<{
    isOpen: boolean;
    connectionId: string | null;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    connectionId: null,
    position: { x: 0, y: 0 }
  });

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0
  });

  const handleContextMenu = useCallback((e: React.MouseEvent, connectionId: string) => {
    e.preventDefault();
    setColorPickerState({
      isOpen: true,
      connectionId,
      position: { x: e.clientX, y: e.clientY }
    });
  }, []);

  const handleTableContextMenu = useCallback((
    e: React.MouseEvent,
    connection: Connection,
    database: string,
    table: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      connection,
      database,
      table
    });
  }, []);

  const handleTableAction = async (action: string) => {
    if (!contextMenu.connection || !contextMenu.database || !contextMenu.table) return;

    const { connection, database, table } = contextMenu;

    try {
      switch (action) {
        case 'edit':
          onTableClick(connection, database, table);
          break;

        case 'truncate':
          if (window.confirm(`Are you sure you want to truncate table "${table}"? This will delete all data.`)) {
            await executeQuery(
              { ...connection, database },
              `TRUNCATE TABLE ${table}`
            );
            toast.success(`Table "${table}" truncated successfully`);
          }
          break;

        case 'drop':
          if (window.confirm(`Are you sure you want to drop table "${table}"? This action cannot be undone.`)) {
            await executeQuery(
              { ...connection, database },
              `DROP TABLE ${table}`
            );
            // Refresh tables list
            await toggleDatabase(connection.id, database);
            toast.success(`Table "${table}" dropped successfully`);
          }
          break;

        case 'export':
          const result = await executeQuery(
            { ...connection, database },
            `SELECT * FROM ${table}`
          );
          
          if (result.rows) {
            const csv = convertToCSV(result.rows);
            downloadCSV(csv, `${table}.csv`);
            toast.success(`Table "${table}" exported successfully`);
          }
          break;

        case 'import':
          // Open file input
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.csv';
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              try {
                const content = await file.text();
                const rows = parseCSV(content);
                if (rows.length > 0) {
                  const columns = Object.keys(rows[0]).join(', ');
                  const values = rows.map(row => 
                    `(${Object.values(row).map(v => `'${v}'`).join(', ')})`
                  ).join(',\n');

                  await executeQuery(
                    { ...connection, database },
                    `INSERT INTO ${table} (${columns}) VALUES ${values}`
                  );
                  toast.success(`Data imported successfully into "${table}"`);
                }
              } catch (error) {
                toast.error('Failed to import data: ' + (error instanceof Error ? error.message : 'Unknown error'));
              }
            }
          };
          input.click();
          break;
      }
    } catch (error) {
      toast.error('Operation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const convertToCSV = (rows: any[]): string => {
    if (rows.length === 0) return '';
    
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] ?? '')
        ).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',').map(v => v.trim());
        return headers.reduce((obj, header, i) => {
          obj[header] = values[i];
          return obj;
        }, {} as any);
      });
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleColorSelect = useCallback((color: string) => {
    if (colorPickerState.connectionId) {
      setConnections(prev => prev.map(conn => 
        conn.id === colorPickerState.connectionId 
          ? { ...conn, color } 
          : conn
      ));
    }
    setColorPickerState(prev => ({ ...prev, isOpen: false }));
  }, [colorPickerState.connectionId, setConnections]);

  const handleSaveConnection = async (connectionData: ConnectionData) => {
    const newConnection: Connection = {
      ...connectionData,
      id: Date.now().toString(),
      isExpanded: false,
      databases: []
    };
    setConnections(prev => [...prev, newConnection]);
    setIsModalOpen(false);
  };

  const toggleConnection = async (connectionId: string) => {
    setConnections(prev => prev.map(conn => {
      if (conn.id === connectionId) {
        return { ...conn, isExpanded: !conn.isExpanded };
      }
      return conn;
    }));

    const connection = connections.find(c => c.id === connectionId);
    if (connection && !connection.databases?.length) {
      setLoading(prev => ({ ...prev, [connectionId]: true }));
      try {
        const databases = await fetchDatabases(connection);
        setConnections(prev => prev.map(conn => {
          if (conn.id === connectionId) {
            return {
              ...conn,
              databases: databases.map(name => ({
                name,
                isExpanded: false,
                tables: []
              }))
            };
          }
          return conn;
        }));
      } catch (error) {
        console.error('Failed to fetch databases:', error);
      }
      setLoading(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const toggleDatabase = async (connectionId: string, dbName: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    setConnections(prev => prev.map(conn => {
      if (conn.id === connectionId) {
        return {
          ...conn,
          databases: conn.databases?.map(db => {
            if (db.name === dbName) {
              return { ...db, isExpanded: !db.isExpanded };
            }
            return db;
          })
        };
      }
      return conn;
    }));

    const database = connection.databases?.find(db => db.name === dbName);
    if (database && !database.tables.length) {
      setLoading(prev => ({ ...prev, [`${connectionId}-${dbName}`]: true }));
      try {
        const tables = await fetchTables({ ...connection, database: dbName });
        setConnections(prev => prev.map(conn => {
          if (conn.id === connectionId) {
            return {
              ...conn,
              databases: conn.databases?.map(db => {
                if (db.name === dbName) {
                  return { ...db, tables };
                }
                return db;
              })
            };
          }
          return conn;
        }));
      } catch (error) {
        console.error('Failed to fetch tables:', error);
      }
      setLoading(prev => ({ ...prev, [`${connectionId}-${dbName}`]: false }));
    }
  };

  return (
    <>
      <div className={`${isCollapsed ? 'w-12' : 'w-64'} bg-gray-800 flex flex-col shrink-0 border-r border-gray-700 transition-all duration-300`}>
        <div className="p-2 border-b border-gray-700 flex items-center justify-between">
          {!isCollapsed && (
            <>
              <div className="flex items-center space-x-2">
                <Database size={18} className="text-blue-400" />
                <span className="font-medium text-sm text-gray-100">Connections</span>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-1 hover:bg-gray-700 rounded-md transition-colors"
                title="Add Connection"
              >
                <Plus size={14} className="text-gray-300 hover:text-white" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
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
        
        {!isCollapsed && (
          <div className="flex-1 overflow-auto">
            <div className="p-2">
              {connections.map(connection => (
                <div 
                  key={connection.id} 
                  className="mb-2"
                  style={{ backgroundColor: connection.color }}
                >
                  <div
                    onContextMenu={(e) => handleContextMenu(e, connection.id)}
                    onClick={() => toggleConnection(connection.id)}
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
                  
                  {connection.isExpanded && connection.databases?.map(db => (
                    <div key={db.name} className="ml-4">
                      <div
                        onClick={() => toggleDatabase(connection.id, db.name)}
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
                      
                      {db.isExpanded && (
                        <div className="ml-8">
                          {db.tables.map(table => (
                            <div
                              key={table}
                              onClick={() => onTableClick(connection, db.name, table)}
                              onContextMenu={(e) => handleTableContextMenu(e, connection, db.name, table)}
                              className="flex items-center space-x-2 p-1 hover:bg-gray-700/50 rounded cursor-pointer group"
                            >
                              <Table2 size={14} className="text-blue-400" />
                              <span 
                                style={{ minWidth: 14, minHeight: 14 }}
                                className="text-xs text-gray-300 group-hover:text-white">{table}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <ConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveConnection}
      />

      {colorPickerState.isOpen && (
        <ColorPicker
          position={colorPickerState.position}
          colors={COLORS}
          onSelect={handleColorSelect}
          onClose={() => setColorPickerState(prev => ({ ...prev, isOpen: false }))}
        />
      )}

      {contextMenu.isOpen && contextMenu.connection && contextMenu.database && contextMenu.table && (
        <TableContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
          connection={contextMenu.connection}
          database={contextMenu.database}
          table={contextMenu.table}
          onAction={handleTableAction}
        />
      )}
    </>
  );
}