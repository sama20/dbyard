import { usePersistentState } from './usePersistentState';
import type { SavedQuery } from '../types';

const STORAGE_KEY = 'saved_queries';

export function useSavedQueries() {
  const [savedQueries, setSavedQueries] = usePersistentState<SavedQuery[]>(STORAGE_KEY, []);

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