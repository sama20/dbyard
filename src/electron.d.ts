interface ElectronAPI {
  // Database operations
  testConnection: (config: any) => Promise<{ success: boolean; message: string }>;
  getDatabases: (config: any) => Promise<string[]>;
  getTables: (config: any) => Promise<string[]>;
  executeQuery: (query: string, config: any) => Promise<{
    rows: any[];
    fields: any[];
    executionTime: number;
  }>;

  // GitHub API operations  
  githubRequest: (endpoint: string, options?: any) => Promise<any>;

  // File operations
  selectFile: () => Promise<string | null>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;

  // Settings
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<void>;
}

interface Window {
  electronAPI: ElectronAPI;
}
