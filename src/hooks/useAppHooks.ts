// src/hooks/useAppHooks.ts
import { useMemo, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useSettings } from './useSettings';
import { useConnections } from './useConnections';
import { useQueryTabs } from './useQueryTabs';
import { useQueryExecution } from './useQueryExecution';
import { useDataUpdater } from './useDataUpdater';
import { useAIModels } from './useAIModels';
import type { Connection, QueryTab } from '../types';

export const useAppHooks = () => {
  const { settings } = useSettings();
  const { connections } = useConnections();
  const { updateUsage } = useAIModels();
  const {
    tabsState,
    createNewTab,
    updateQuery,
    closeTab,
    setActiveTabId,
    updateTabConnection,
    updateTabDatabase,
    updateTabResult
  } = useQueryTabs('SELECT * FROM users LIMIT 10;');

  const {
    activeResultTab,
    setActiveResultTab,
    executeQueryWithConnection
  } = useQueryExecution();

  const { updateData } = useDataUpdater();

  const activeTab = useMemo(() => 
    tabsState.tabs.find(tab => tab.id === tabsState.activeTabId) || tabsState.tabs[0],
    [tabsState.activeTabId, tabsState.tabs]
  );

  const activeConnection = useMemo(() => 
    connections.find(c => c.id === activeTab.connectionId),
    [connections, activeTab.connectionId]
  );

  const handleTableClick = useCallback(async (connection: Connection, database: string, table: string) => {
    const query = `SELECT * FROM ${table} LIMIT ${settings.defaultLimit};`;
    const newTab: QueryTab = {
      id: nanoid(),
      title: table,
      query,
      connectionId: connection.id,
      database
    };

    createNewTab(newTab);

    try {
      const result = await executeQueryWithConnection(connection, database, query);
      updateTabResult(result);
    } catch (error) {
      updateTabResult(undefined, error instanceof Error ? error.message : 'Query failed');
    }
  }, [settings.defaultLimit, executeQueryWithConnection, createNewTab, updateTabResult]);

  const handleExecuteQuery = useCallback(async () => {
    if (!activeConnection || !activeTab.database) return;
    
    try {
      const result = await executeQueryWithConnection(
        activeConnection,
        activeTab.database,
        activeTab.query
      );
      updateTabResult(result);
      
      // Track usage for manual queries (simulate token usage based on query length)
      const estimatedTokens = Math.max(Math.floor(activeTab.query.length / 4), 10);
      updateUsage(estimatedTokens);
    } catch (error) {
      updateTabResult(undefined, error instanceof Error ? error.message : 'Query failed');
    }
  }, [activeConnection, activeTab.database, activeTab.query, executeQueryWithConnection, updateTabResult, updateUsage]);

  const handleUpdateData = useCallback(async (changes: Array<Record<string, any>>) => {
    if (!activeConnection || !activeTab.database || !activeTab.result?.fields) return;
    
    try {
      await updateData(
        activeConnection,
        activeTab.database,
        activeTab.query,
        activeTab.result,
        changes
      );
      await handleExecuteQuery();
    } catch (error) {
      // Error will be handled by executeQueryWithConnection
    }
  }, [activeConnection, activeTab, updateData, handleExecuteQuery]);

  return {
    settings,
    connections,
    tabsState,
    createNewTab,
    updateQuery,
    closeTab,
    setActiveTabId,
    updateTabConnection,
    updateTabDatabase,
    updateTabResult,
    activeResultTab,
    setActiveResultTab,
    executeQueryWithConnection,
    updateData,
    activeTab,
    activeConnection,
    handleTableClick,
    handleExecuteQuery,
    handleUpdateData
  };
};
