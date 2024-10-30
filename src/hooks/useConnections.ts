import { useState, useEffect } from 'react';
import type { Connection } from '../types';

const STORAGE_KEY = 'db_connections';

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
  }, [connections]);

  return { connections, setConnections };
}