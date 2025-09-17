import type { ConnectionData } from '../types';
import * as mysqlElectron from './mysql-electron';

// Check if we're running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

const API_URL = 'http://localhost:3001/api';

interface QueryResult {
  rows: any[];
  fields: any[];
  executionTime: number;
  rowsAffected: number;
}

export async function testSSHConnection(sshConfig: ConnectionData['sshConfig']): Promise<{ success: boolean; message: string }> {
  if (isElectron()) {
    // SSH testing is handled within testConnection in Electron
    return { success: true, message: 'SSH will be tested with database connection' };
  }
  
  try {
    const response = await fetch(`${API_URL}/test-ssh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sshConfig)
    });
    
    return await response.json();
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'SSH connection failed'
    };
  }
}

export async function testConnection(config: ConnectionData): Promise<{ success: boolean; message: string }> {
  if (isElectron()) {
    return mysqlElectron.testConnection(config);
  }
  
  try {
    const response = await fetch(`${API_URL}/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    
    return await response.json();
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

export async function fetchDatabases(config: ConnectionData): Promise<string[]> {
  if (isElectron()) {
    return mysqlElectron.fetchDatabases(config);
  }
  
  const response = await fetch(`${API_URL}/databases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch databases');
  }
  
  return await response.json();
}

export async function fetchTables(config: ConnectionData): Promise<string[]> {
  if (isElectron()) {
    return mysqlElectron.fetchTables(config);
  }
  
  const response = await fetch(`${API_URL}/tables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch tables');
  }
  
  return await response.json();
}

export async function executeQuery(config: ConnectionData, query: string): Promise<QueryResult> {
  if (isElectron()) {
    return mysqlElectron.executeQuery(query, config);
  }
  
  try {
    const response = await fetch(`${API_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, query })
    });

    if (!response.ok) {
      throw new Error('Failed to execute query');
    }

    const result = await response.json();
    
    return {
      rows: Array.isArray(result.rows) ? result.rows : [],
      fields: result.fields || [],
      executionTime: result.executionTime || 0,
      rowsAffected: result.rowsAffected || 0
    };
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}