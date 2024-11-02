import React from 'react';
import { X, Trash2 } from 'lucide-react';
import type { SavedQuery } from '../types';

interface SavedQueriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  queries: SavedQuery[];
  onSelect: (query: SavedQuery) => void;
  onDelete: (id: string) => void;
}

export default function SavedQueriesModal({ isOpen, onClose, queries, onSelect, onDelete }: SavedQueriesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-3 border-b border-gray-700">
          <h2 className="text-base font-medium text-gray-100">Saved Queries</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-3">
          {queries.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No saved queries found
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {queries.map((query) => (
                <div
                  key={query.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-700/50 rounded group"
                >
                  <div className="flex-1 mr-4">
                    <h3 className="text-sm font-medium text-gray-200 mb-1">{query.name}</h3>
                    <p className="text-xs text-gray-400 font-mono truncate">{query.query}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(query.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onSelect(query)}
                      className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => onDelete(query.id)}
                      className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-gray-600/50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}