import React, { useState, useCallback } from 'react';
import { Database, FileJson, Save, Settings, Sun, Moon } from 'lucide-react';
import { nanoid } from 'nanoid';
import Sidebar from './components/Sidebar';
import QueryEditor from './components/QueryEditor';
import ResultsTable from './components/ResultsTable';
import Toolbar from './components/Toolbar';
import QueryTabs from './components/QueryTabs';
import { useTheme } from './hooks/useTheme';
import type { QueryTab } from './types';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [tabs, setTabs] = useState<QueryTab[]>([
    { id: nanoid(), title: 'Query 1', query: 'SELECT * FROM users LIMIT 10;' }
  ]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);

  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

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

  return (
    <div className={`flex h-screen w-full ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} overflow-hidden`}>
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen">
        <nav className={`h-12 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-b flex items-center px-4 shrink-0 justify-between`}>
          <div className="flex space-x-4">
            <button 
              onClick={createNewTab}
              className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              title="New Query"
            >
              <FileJson size={18} />
            </button>
            <button className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors">
              <Save size={18} />
            </button>
            <button className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors">
              <Settings size={18} />
            </button>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
        
        <QueryTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={setActiveTabId}
          onTabClose={closeTab}
        />
        
        <Toolbar />
        
        <div className="flex-1 flex flex-col min-h-0">
          <QueryEditor 
            value={activeTab.query} 
            onChange={updateQuery}
          />
          <div className="flex-1 min-h-0">
            <ResultsTable />
          </div>
        </div>
        
        <footer className={`h-6 bg-blue-600 text-xs flex items-center px-4 shrink-0 ${theme === 'dark' ? 'text-white' : 'text-white'}`}>
          <span>Connected: localhost:5432</span>
        </footer>
      </main>
    </div>
  );
}

export default App;