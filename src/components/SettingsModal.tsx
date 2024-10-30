import React from 'react';
import { X } from 'lucide-react';
import type { Settings } from '../hooks/useSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [formData, setFormData] = React.useState(settings);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
          onClose();
        }} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Default Row Limit</label>
            <input
              type="number"
              value={formData.defaultLimit}
              onChange={e => setFormData(prev => ({ ...prev, defaultLimit: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Font Size (px)</label>
            <input
              type="number"
              value={formData.fontSize}
              onChange={e => setFormData(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              max="24"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showLineNumbers"
              checked={formData.showLineNumbers}
              onChange={e => setFormData(prev => ({ ...prev, showLineNumbers: e.target.checked }))}
              className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700"
            />
            <label htmlFor="showLineNumbers" className="text-sm font-medium text-gray-300">
              Show Line Numbers
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-gray-100 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}