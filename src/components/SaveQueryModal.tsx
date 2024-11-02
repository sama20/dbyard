import React, { useState } from 'react';
import { X } from 'lucide-react';

interface SaveQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export default function SaveQueryModal({ isOpen, onClose, onSave }: SaveQueryModalProps) {
  const [queryName, setQueryName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryName.trim()) {
      onSave(queryName.trim());
      setQueryName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-sm">
        <div className="flex justify-between items-center p-3 border-b border-gray-700">
          <h2 className="text-base font-medium text-gray-100">Save Query</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-3">
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-300 mb-1">Query Name</label>
            <input
              type="text"
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter query name"
              autoFocus
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-gray-100 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}