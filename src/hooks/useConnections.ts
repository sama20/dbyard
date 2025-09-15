import { usePersistentState } from './usePersistentState';
import type { Connection } from '../types';

const STORAGE_KEY = 'db_connections';

export function useConnections() {
  const [connections, setConnections] = usePersistentState<Connection[]>(STORAGE_KEY, []);

  const updateConnectionColor = (connectionId: string, color: string | null) => {
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId ? { ...conn, color: color ?? undefined } : conn
    ));
  };

  return { connections, setConnections, updateConnectionColor };
}