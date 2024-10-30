import React from 'react';
import ResultsTable from './ResultsTable';
import QueryInfo from './QueryInfo';

interface ResultsPanelProps {
  activeTab: 'results' | 'info';
  onTabChange: (tab: 'results' | 'info') => void;
  queryResult: any;
}

export default function ResultsPanel({ activeTab, onTabChange, queryResult }: ResultsPanelProps) {
  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700 flex">
        <button
          className={`px-4 py-1.5 text-xs ${
            activeTab === 'results'
              ? 'bg-gray-900 text-gray-100'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => onTabChange('results')}
        >
          Results {queryResult?.rowsAffected ? `(${queryResult.rowsAffected} rows)` : ''}
        </button>
        <button
          className={`px-4 py-1.5 text-xs ${
            activeTab === 'info'
              ? 'bg-gray-900 text-gray-100'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => onTabChange('info')}
        >
          Query Info
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {activeTab === 'results' ? (
          <ResultsTable data={queryResult?.rows} fields={queryResult?.fields} />
        ) : (
          <QueryInfo queryResult={queryResult} />
        )}
      </div>
    </div>
  );
}