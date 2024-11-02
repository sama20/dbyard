import { useState, useEffect } from 'react';
import type { SavedQuery } from '../types';

const STORAGE_KEY = 'saved_queries';

export function useSavedQueries() {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedQueries));
  }, [savedQueries]);

  const saveQuery = (name: string, query: string) => {
    setSavedQueries(prev => [...prev, {
      id: Date.now().toString(),
      name,
      query,
      createdAt: Date.now()
    }]);
  };

  const deleteQuery = (id: string) => {
    setSavedQueries(prev => prev.filter(query => query.id !== id));
  };

  return { savedQueries, saveQuery, deleteQuery };
}