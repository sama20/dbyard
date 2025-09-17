import type { ConnectionData } from '../types';

// Check if we're running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

interface QueryResult {
  rows: any[];
  fields: any[];
  executionTime: number;
  rowsAffected: number;
}

export async function testConnection(config: ConnectionData): Promise<{ success: boolean; message: string }> {
  if (isElectron()) {
    return window.electronAPI.testConnection(config);
  } else {
    throw new Error('Database connections are only available in the desktop application');
  }
}

export async function testSSHConnection(sshConfig: ConnectionData['sshConfig']): Promise<{ success: boolean; message: string }> {
  // SSH testing is handled as part of the main connection test in Electron
  if (isElectron()) {
    return { success: true, message: 'SSH configuration will be tested with the main connection' };
  } else {
    throw new Error('SSH connections are only available in the desktop application');
  }
}

export async function fetchDatabases(config: ConnectionData): Promise<string[]> {
  if (isElectron()) {
    return window.electronAPI.getDatabases(config);
  } else {
    throw new Error('Database operations are only available in the desktop application');
  }
}

export async function fetchTables(config: ConnectionData): Promise<string[]> {
  if (isElectron()) {
    return window.electronAPI.getTables(config);
  } else {
    throw new Error('Database operations are only available in the desktop application');
  }
}

export async function executeQuery(query: string, config: ConnectionData): Promise<QueryResult> {
  if (isElectron()) {
    return window.electronAPI.executeQuery(query, config);
  } else {
    throw new Error('Query execution is only available in the desktop application');
  }
}

// Export all other functions that might be needed
export async function fetchTableSchema(config: ConnectionData, tableName: string): Promise<any[]> {
  if (isElectron()) {
    const query = `DESCRIBE \`${tableName}\``;
    const result = await window.electronAPI.executeQuery(query, config);
    return result.rows;
  } else {
    throw new Error('Schema operations are only available in the desktop application');
  }
}

export async function fetchTableData(config: ConnectionData, tableName: string, limit = 100): Promise<QueryResult> {
  if (isElectron()) {
    const query = `SELECT * FROM \`${tableName}\` LIMIT ${limit}`;
    return window.electronAPI.executeQuery(query, config);
  } else {
    throw new Error('Data fetching is only available in the desktop application');
  }
}
