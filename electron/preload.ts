import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
interface ElectronAPI {
  // Database operations
  testConnection: (config: any) => Promise<{ success: boolean; message: string }>;
  getDatabases: (config: any) => Promise<string[]>;
  getTables: (config: any) => Promise<string[]>;
  executeQuery: (query: string, config: any) => Promise<{
    rows: any[];
    fields: any[];
    executionTime: number;
    rowsAffected: number;
  }>;
  
  // GitHub API operations
  githubAuth: (authData: any) => Promise<any>;
  githubToken: (tokenData: any) => Promise<any>;
  
  // File operations
  showOpenDialog: (options: any) => Promise<any>;
  showSaveDialog: (options: any) => Promise<any>;
}

// Expose the API to the renderer process
const electronAPI: ElectronAPI = {
  testConnection: (config) => ipcRenderer.invoke('test-connection', config),
  getDatabases: (config) => ipcRenderer.invoke('get-databases', config),
  getTables: (config) => ipcRenderer.invoke('get-tables', config),
  executeQuery: (query, config) => ipcRenderer.invoke('execute-query', query, config),
  
  githubAuth: (authData) => ipcRenderer.invoke('github-auth', authData),
  githubToken: (tokenData) => ipcRenderer.invoke('github-token', tokenData),
  
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
};

// Expose the API to the window object
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the window object
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
