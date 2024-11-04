import { useState, useCallback } from 'react';
import { executeQuery } from '../services/mysql';
import type { Connection, QueryResult } from '../types';

export const useQueryExecution = () => {
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | undefined>();
  const [activeResultTab, setActiveResultTab] = useState<'results' | 'info'>('results');

  const executeQueryWithConnection = useCallback(async (
    connection: Connection,
    database: string,
    query: string
  ) => {
    setQueryError(undefined);
    setQueryResult(null);

    try {
      const result = await executeQuery({ ...connection, database }, query);
      setQueryResult(result);
      setActiveResultTab('results');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Query execution failed';
      setQueryError(errorMessage);
      throw error;
    }
  }, []);

  return {
    queryResult,
    queryError,
    activeResultTab,
    setActiveResultTab,
    executeQueryWithConnection
  };
};