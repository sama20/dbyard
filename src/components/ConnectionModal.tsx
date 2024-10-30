import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { testConnection } from '../services/mysql';
import type { ConnectionData } from '../types';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (connection: ConnectionData) => void;
}

export default function ConnectionModal({ isOpen, onClose, onSave }: ConnectionModalProps) {
  const [formData, setFormData] = useState<ConnectionData>({
    name: '',
    host: '',
    port: '3306',
    username: '',
    password: '',
    database: ''
  });

  const [testStatus, setTestStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  }>({
    tested: false,
    success: false,
    message: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Reset test status when form data changes
    setTestStatus({ tested: false, success: false, message: '' });
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (testStatus.tested && testStatus.success) {
      onSave(formData);
    }
  };

  const handleTest = async () => {
    setIsLoading(true);
    const result = await testConnection(formData);
    setTestStatus({
      tested: true,
      success: result.success,
      message: result.message
    });
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const isFormValid = formData.name && formData.host && formData.port && 
                     formData.username && formData.database;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">New Connection</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Connection Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Database"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Host</label>
              <input
                type="text"
                value={formData.host}
                onChange={e => setFormData(prev => ({ ...prev, host: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="localhost"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Port</label>
              <input
                type="text"
                value={formData.port}
                onChange={e => setFormData(prev => ({ ...prev, port: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3306"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Database</label>
            <input
              type="text"
              value={formData.database}
              onChange={e => setFormData(prev => ({ ...prev, database: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {testStatus.tested && (
            <div className={`p-3 rounded-md ${
              testStatus.success ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
            }`}>
              {testStatus.message}
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-gray-100 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={!isFormValid || isLoading}
              className="px-4 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              <span>Test Connection</span>
            </button>
            <button
              type="submit"
              disabled={!testStatus.success || !isFormValid}
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}