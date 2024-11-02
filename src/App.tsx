import React, { useState, useCallback } from 'react';
import { Database, FileJson, Save, Settings as SettingsIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import QueryEditor from './components/QueryEditor';
import ResultsPanel from './components/ResultsPanel';
import Toolbar from './components/Toolbar';
import QueryTabs from './components/QueryTabs';
import SettingsModal from './components/SettingsModal';
import { useSettings } from './hooks/useSettings';
import { useConnections } from './hooks/useConnections';
import { executeQuery } from './services/mysql';
import type { QueryTab, Connection } from './types';

function App() {
  const { settings, setSettings } = useSettings();
  const { connections } = useConnections();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tabs, setTabs] = useState<QueryTab[]>([
    { id: nanoid(), title: 'Query 1', query: 'SELECT * FROM users LIMIT 10;' }
  ]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [editorHeight, setEditorHeight] = useState(200);
  const [activeResultTab, setActiveResultTab] = useState<'results' | 'info'>('results');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | undefined>();

  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
  const activeConnection = connections.find(c => c.id === activeTab.connectionId);

  const updateTabConnection = useCallback((connectionId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, connectionId, database: undefined } : tab
    ));
  }, [activeTabId]);

  const updateTabDatabase = useCallback((database: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, database } : tab
    ));
  }, [activeTabId]);

  const handleTableClick = useCallback(async (connection: Connection, database: string, table: string) => {
    const query = `SELECT * FROM ${table} LIMIT ${settings.defaultLimit};`;
    const newTab: QueryTab = {
      id: nanoid(),
      title: table,
      query,
      connectionId: connection.id,
      database
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setQueryError(undefined);

    try {
      const result = await executeQuery({ ...connection, database }, query);
      setQueryResult(result);
      setActiveResultTab('results');
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : 'Failed to fetch table data');
    }
  }, [settings.defaultLimit]);

  const createNewTab = useCallback(() => {
    const newTab: QueryTab = {
      id: nanoid(),
      title: `Query ${tabs.length + 1}`,
      query: ''
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs.length]);

  const updateQuery = useCallback((query: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, query } : tab
    ));
  }, [activeTabId]);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  }, [activeTabId]);

  const handleExecuteQuery = async () => {
    if (!activeConnection || !activeTab.database) return;
    setQueryError(undefined);

    try {
      const result = await executeQuery(
        { ...activeConnection, database: activeTab.database },
        activeTab.query
      );
      setQueryResult(result);
      setActiveResultTab('results');
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : 'Query execution failed');
      setQueryResult(null);
    }
  };

  const handleUpdateData = async (changes: any[]) => {
    if (!activeConnection || !activeTab.database || !queryResult?.fields) return;

    // Extract table name from the query
    const tableMatch = activeTab.query.match(/FROM\s+`?(\w+)`?/i);
    if (!tableMatch) {
      setQueryError('Could not determine table name from query');
      return;
    }

    const tableName = tableMatch[1];
    const primaryKeyField = queryResult.fields.find((f: any) => f.flags & 2); // Check for primary key flag

    if (!primaryKeyField) {
      setQueryError('No primary key found in the result set');
      return;
    }

    try {
      for (const row of changes) {
        const setClauses = Object.keys(row)
          .filter(key => key !== primaryKeyField.name) // Exclude primary key from SET clause
          .map(key => `${key} = ${row[key] === null ? 'NULL' : `'${row[key]}'`}`)
          .join(', ');

        const updateQuery = `UPDATE ${tableName} SET ${setClauses} WHERE ${primaryKeyField.name} = '${row[primaryKeyField.name]}'`;
        await executeQuery(
          { ...activeConnection, database: activeTab.database },
          updateQuery
        );
      }

      // Refresh the data
      handleExecuteQuery();
    } catch (error) {
      console.error('Update error:', error);
      setQueryError(error instanceof Error ? error.message : 'Failed to update data');
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-900 text-gray-100 overflow-hidden">
      <Sidebar 
        onTableClick={handleTableClick}
        connections={connections}
      />
      <main className="flex-1 flex flex-col min-h-screen overflow-auto">
        <nav className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-3 shrink-0 justify-between">
          <div className="flex space-x-3">
            <button 
              onClick={createNewTab}
              className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              title="New Query"
            >
              <FileJson size={16} />
            </button>
            <button className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors">
              <Save size={16} />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
            >
              <SettingsIcon size={16} />
            </button>
          </div>
        </nav>
        
        <QueryTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={setActiveTabId}
          onTabClose={closeTab}
        />
        
        <Toolbar 
          connections={connections}
          activeTab={activeTab}
          onConnectionChange={updateTabConnection}
          onDatabaseChange={updateTabDatabase}
          onExecuteQuery={handleExecuteQuery}
        />
        
        <div className="flex-1 flex flex-col min-h-0">
          <QueryEditor 
            value={activeTab.query} 
            onChange={updateQuery}
            height={editorHeight}
            onResize={setEditorHeight}
            settings={settings}
            backgroundColor={activeConnection?.color}
            activeConnection={activeConnection}
          />
          <div className="flex-1 min-h-0">
            <ResultsPanel
              activeTab={activeResultTab}
              onTabChange={setActiveResultTab}
              queryResult={queryResult}
              error={queryError}
              backgroundColor={activeConnection?.color}
              onUpdateData={handleUpdateData}
            />
          </div>
        </div>
        
        <footer className="h-5 bg-blue-600 text-xs flex items-center px-3 shrink-0 text-white">
          <span>Connected: localhost:5432</span>
        </footer>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />
      
      <Toaster position="top-right" />
    </div>
  );
}

export default App;