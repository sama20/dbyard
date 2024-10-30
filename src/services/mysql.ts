const API_URL = 'http://localhost:3001/api';

export async function testConnection(config: ConnectionData): Promise<{ success: boolean; message: string }> {
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