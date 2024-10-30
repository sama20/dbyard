import React, { useState } from 'react';
import { Database, Table2, FolderOpen, Plus, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import ConnectionModal from './ConnectionModal';
import { fetchDatabases, fetchTables, executeQuery } from '../services/mysql';
import { useConnections } from '../hooks/useConnections';
import { useSettings } from '../hooks/useSettings';
import type { Connection, ConnectionData, Database as DatabaseType } from '../types';

interface SidebarProps {
  onTableClick: (connection: Connection, database: string, table: string) => void;
}

export default function Sidebar({ onTableClick }: SidebarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { connections, setConnections } = useConnections();
  const { settings } = useSettings();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

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

  const handleTableClick = (connection: Connection, dbName: string, table: string) => {
    onTableClick(connection, dbName, table);
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
              <div key={connection.id} className="mb-2">
                <div
                  onClick={() => toggleConnection(connection.id)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer group"
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
                      className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer group"
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
                            onClick={() => handleTableClick(connection, db.name, table)}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer group"
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
    </>
  );
}