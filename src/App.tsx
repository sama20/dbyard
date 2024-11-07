// src/App.tsx
import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { FileJson, Settings as SettingsIcon } from 'lucide-react';
import Sidebar from './components/Sidebar';
import QueryEditor from './components/QueryEditor';
import ResultsPanel from './components/ResultsPanel';
import Toolbar from './components/Toolbar';
import QueryTabs from './components/QueryTabs';
import SettingsModal from './components/SettingsModal';
import { useAppHooks } from './hooks/useAppHooks';
import usePreventRightClick from './hooks/usePreventRightClick';
import { useSettings } from './hooks/useSettings';

const App: React.FC = () => {
  const { settings, setSettings } = useSettings();
  const {    
    connections,
    tabsState,
    createNewTab,
    updateQuery,
    closeTab,
    setActiveTabId,
    updateTabConnection,
    updateTabDatabase,
    activeResultTab,
    setActiveResultTab,
    activeTab,
    activeConnection,
    handleTableClick,
    handleExecuteQuery,
    handleUpdateData
  } = useAppHooks();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editorHeight, setEditorHeight] = useState(200);

  // Use the custom hook to prevent right-click
  usePreventRightClick();

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
              queryResult={activeTab.result}
              error={activeTab.error}
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
