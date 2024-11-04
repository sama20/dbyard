import React from 'react';
import { FileJson, Settings as SettingsIcon } from 'lucide-react';

interface MainLayoutProps {
  onNewTab: () => void;
  onOpenSettings: () => void;
  children: React.ReactNode;
  connectionStatus?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  onNewTab,
  onOpenSettings,
  children,
  connectionStatus
}) => (
  <div className="flex h-screen w-full bg-gray-900 text-gray-100 overflow-hidden">
    <main className="flex-1 flex flex-col min-h-screen overflow-auto">
      <nav className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-3 shrink-0 justify-between">
        <div className="flex space-x-3">
          <button 
            onClick={onNewTab}
            className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
            title="New Query"
          >
            <FileJson size={16} />
          </button>
          <button 
            onClick={onOpenSettings}
            className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </nav>
      {children}
      <footer className="h-5 bg-blue-600 text-xs flex items-center px-3 shrink-0 text-white">
        <span>{connectionStatus || 'Not connected'}</span>
      </footer>
    </main>
  </div>
);