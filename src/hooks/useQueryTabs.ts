import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { QueryTab, QueryResult } from '../types';

interface QueryTabsState {
  tabs: Array<QueryTab & { result?: QueryResult; error?: string }>;
  activeTabId: string;
}

export const useQueryTabs = (initialQuery: string = '') => {
  const [tabsState, setTabsState] = useState<QueryTabsState>(() => {
    const initialTab: QueryTab = {
      id: nanoid(),
      title: 'Query 1',
      query: initialQuery
    };
    return {
      tabs: [initialTab],
      activeTabId: initialTab.id
    };
  });

  const createNewTab = useCallback((tabData?: Partial<QueryTab>) => {
    const newTab: QueryTab = {
      id: nanoid(),
      title: tabData?.title || `Query ${tabsState.tabs.length + 1}`,
      query: tabData?.query || '',
      connectionId: tabData?.connectionId,
      database: tabData?.database
    };

    setTabsState(prev => ({
      tabs: [...prev.tabs, newTab],
      activeTabId: newTab.id
    }));
  }, [tabsState.tabs.length]);

  const updateQuery = useCallback((query: string) => {
    setTabsState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => 
        tab.id === prev.activeTabId
          ? { ...tab, query }
          : tab
      )
    }));
  }, []);

  const updateTabResult = useCallback((result: QueryResult | undefined, error?: string) => {
    setTabsState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => 
        tab.id === prev.activeTabId
          ? { ...tab, result, error }
          : tab
      )
    }));
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabsState(prev => {
      const newTabs = prev.tabs.filter(tab => tab.id !== tabId);
      return {
        tabs: newTabs,
        activeTabId: prev.activeTabId === tabId
          ? newTabs[newTabs.length - 1]?.id || ''
          : prev.activeTabId
      };
    });
  }, []);

  const setActiveTabId = useCallback((tabId: string) => {
    setTabsState(prev => ({
      ...prev,
      activeTabId: tabId
    }));
  }, []);

  const updateTabConnection = useCallback((connectionId: string) => {
    setTabsState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => 
        tab.id === prev.activeTabId 
          ? { ...tab, connectionId, database: undefined }
          : tab
      )
    }));
  }, []);

  const updateTabDatabase = useCallback((database: string) => {
    setTabsState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => 
        tab.id === prev.activeTabId
          ? { ...tab, database }
          : tab
      )
    }));
  }, []);

  return {
    tabsState,
    createNewTab,
    updateQuery,
    updateTabResult,
    closeTab,
    setActiveTabId,
    updateTabConnection,
    updateTabDatabase
  };
};