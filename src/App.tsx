// App.tsx
import React, { useMemo } from 'react';
import { nanoid } from 'nanoid';
import { Toaster } from 'react-hot-toast';
import { FileJson, Settings as SettingsIcon } from 'lucide-react';
import Sidebar from './components/Sidebar';
import QueryEditor from './components/QueryEditor';
import ResultsPanel from './components/ResultsPanel';
import Toolbar from './components/Toolbar';
import QueryTabs from './components/QueryTabs';
import SettingsModal from './components/SettingsModal';
import { useSettings } from './hooks/useSettings';
import { useConnections } from './hooks/useConnections';
import { useQueryTabs } from './hooks/useQueryTabs';
import { useQueryExecution } from './hooks/useQueryExecution';
import { useDataUpdater } from './hooks/useDataUpdater';
import type { Connection, QueryTab } from './types';

const App: React.FC = () => {
  const { settings, setSettings } = useSettings();
  const { connections } = useConnections();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [editorHeight, setEditorHeight] = React.useState(200);

  const {
    tabsState,
    createNewTab,
    updateQuery,
    closeTab,
    setActiveTabId,
    updateTabConnection,
    updateTabDatabase
  } = useQueryTabs('SELECT * FROM users LIMIT 10;');

  const {
    queryResult,
    queryError,
    activeResultTab,
    setActiveResultTab,
    executeQueryWithConnection
  } = useQueryExecution();

  const { updateData } = useDataUpdater();

  const activeTab = useMemo(() => 
    tabsState.tabs.find(tab => tab.id === tabsState.activeTabId) || tabsState.tabs[0],
    [tabsState.activeTabId, tabsState.tabs]
  );

  const activeConnection = useMemo(() => 
    connections.find(c => c.id === activeTab.connectionId),
    [connections, activeTab.connectionId]
  );

  const handleTableClick = React.useCallback(async (connection: Connection, database: string, table: string) => {
    const query = `SELECT * FROM ${table} LIMIT ${settings.defaultLimit};`;
    const newTab: QueryTab = {
      id: nanoid(),
      title: table,
      query,
      connectionId: connection.id,
      database
    };

    createNewTab(newTab);

    try {
      await executeQueryWithConnection(connection, database, query);
    } catch (error) {
      // Error handling is done within executeQueryWithConnection
    }
  }, [settings.defaultLimit, executeQueryWithConnection, createNewTab]);

  const handleExecuteQuery = React.useCallback(async () => {
    if (!activeConnection || !activeTab.database) return;
    
    try {
      await executeQueryWithConnection(
        activeConnection,
        activeTab.database,
        activeTab.query
      );
    } catch (error) {
      // Error handling is done within executeQueryWithConnection
    }
  }, [activeConnection, activeTab.database, activeTab.query, executeQueryWithConnection]);

  const handleUpdateData = React.useCallback(async (changes: Array<Record<string, any>>) => {
    if (!activeConnection || !activeTab.database || !queryResult?.fields) return;
    
    try {
      await updateData(
        activeConnection,
        activeTab.database,
        activeTab.query,
        queryResult,
        changes
      );
      await handleExecuteQuery();
    } catch (error) {
      // Error will be handled by executeQueryWithConnection
    }
  }, [activeConnection, activeTab, queryResult, updateData, handleExecuteQuery]);

  return (
    <div className="flex h-screen w-full bg-gray-900 text-gray-100 overflow-hidden">
      <Sidebar 
        onTableClick={handleTableClick}
        connections={connections}
      />
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        <nav className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-3 shrink-0 justify-between">
          <div className="flex space-x-3">
            <button 
              onClick={() => createNewTab()}
              className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              title="New Query"
            >
              <FileJson size={16} />
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
          tabs={tabsState.tabs}
          activeTabId={tabsState.activeTabId}
          onTabSelect={setActiveTabId}
          onTabClose={closeTab}
        />
        
        <Toolbar 
          connections={connections}
          activeTab={activeTab}
          onConnectionChange={updateTabConnection}
          onDatabaseChange={updateTabDatabase}
          onExecuteQuery={handleExecuteQuery}
          onLoadQuery={updateQuery}
        />
        
        <div className="flex-1 flex flex-col min-h-0">
          <QueryEditor 
            key={activeTab.id}
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
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />
      
      <Toaster position="top-right" />
    </div>
  );
};

export default App;