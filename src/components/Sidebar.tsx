import React, { useState, useEffect, useCallback } from 'react';
import { Database, Table2, FolderOpen, Plus, ChevronRight, ChevronDown, Loader2, Palette } from 'lucide-react';
import ConnectionModal from './ConnectionModal';
import ColorPicker from './ColorPicker';
import { fetchDatabases, fetchTables } from '../services/mysql';
import { useConnections } from '../hooks/useConnections';
import { useSettings } from '../hooks/useSettings';
import type { Connection, ConnectionData } from '../types';

interface SidebarProps {
  onTableClick: (connection: Connection, database: string, table: string) => void;
}

const COLORS = [
  { label: 'Blue', value: 'rgba(59, 130, 246, 0.1)' },
  { label: 'Green', value: 'rgba(16, 185, 129, 0.1)' },
  { label: 'Red', value: 'rgba(239, 68, 68, 0.1)' },
  { label: 'Purple', value: 'rgba(139, 92, 246, 0.1)' },
  { label: 'Yellow', value: 'rgba(245, 158, 11, 0.1)' },
  { label: 'None', value: '' }
];

export default function Sidebar({ onTableClick }: SidebarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { connections, setConnections } = useConnections();
  const { settings } = useSettings();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [colorPickerState, setColorPickerState] = useState<{
    isOpen: boolean;
    connectionId: string | null;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    connectionId: null,
    position: { x: 0, y: 0 }
  });

  const handleContextMenu = useCallback((e: React.MouseEvent, connectionId: string) => {
    e.preventDefault();
    setColorPickerState({
      isOpen: true,
      connectionId,
      position: { x: e.clientX, y: e.clientY }
    });
  }, []);

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
      <div className="w-64 bg-gray-800 flex flex-col shrink-0 border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database size={20} className="text-blue-400" />
              <span className="font-semibold text-gray-100">Connections</span>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1 hover:bg-gray-700 rounded-md transition-colors"
              title="Add Connection"
            >
              <Plus size={16} className="text-gray-300 hover:text-white" />
            </button>
          </div>
        </div>
        
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
                  className="flex items-center space-x-2 p-2 hover:bg-gray-700/50 rounded cursor-pointer group"
                >
                  {loading[connection.id] ? (
                    <Loader2 size={16} className="text-blue-400 animate-spin" />
                  ) : connection.isExpanded ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                  <Database size={16} className="text-blue-400" />
                  <span className="text-gray-200 group-hover:text-white">{connection.name}</span>
                </div>
                
                {connection.isExpanded && connection.databases?.map(db => (
                  <div key={db.name} className="ml-4">
                    <div
                      onClick={() => toggleDatabase(connection.id, db.name)}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-700/50 rounded cursor-pointer group"
                    >
                      {loading[`${connection.id}-${db.name}`] ? (
                        <Loader2 size={16} className="text-yellow-500 animate-spin" />
                      ) : db.isExpanded ? (
                        <ChevronDown size={16} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400" />
                      )}
                      <FolderOpen size={16} className="text-yellow-500" />
                      <span className="text-gray-300 group-hover:text-white">{db.name}</span>
                    </div>
                    
                    {db.isExpanded && (
                      <div className="ml-4">
                        {db.tables.map(table => (
                          <div
                            key={table}
                            onClick={() => onTableClick(connection, db.name, table)}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-700/50 rounded cursor-pointer group"
                          >
                            <Table2 size={16} className="text-blue-400" />
                            <span className="text-gray-300 group-hover:text-white">{table}</span>
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
    </>
  );
}