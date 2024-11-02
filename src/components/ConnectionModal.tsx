import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { testConnection } from '../services/mysql';
import type { ConnectionData } from '../types';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (connection: ConnectionData) => void;
}

interface SSHConfig {
  host: string;
  port: string;
  username: string;
  password?: string;
  privateKey?: string;
}

export default function ConnectionModal({ isOpen, onClose, onSave }: ConnectionModalProps) {
  const [formData, setFormData] = useState<ConnectionData & { useSSH: boolean; sshConfig?: SSHConfig }>({
    name: '',
    host: '',
    port: '3306',
    username: '',
    password: '',
    database: '',
    useSSH: false,
    sshConfig: {
      host: '',
      port: '22',
      username: '',
      password: '',
      privateKey: ''
    }
  });

  const [testStatus, setTestStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    type?: 'ssh' | 'mysql';
  }>({
    tested: false,
    success: false,
    message: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSSHDetails, setShowSSHDetails] = useState(false);

  useEffect(() => {
    setTestStatus({ tested: false, success: false, message: '' });
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (testStatus.tested && testStatus.success) {
      const connectionData: ConnectionData = {
        name: formData.name,
        host: formData.host,
        port: formData.port,
        username: formData.username,
        password: formData.password,
        database: formData.database
      };
      if (formData.useSSH) {
        connectionData.sshConfig = formData.sshConfig;
      }
      onSave(connectionData);
    }
  };

  const handleTest = async () => {
    setIsLoading(true);
    try {
      const result = await testConnection(formData);
      setTestStatus({
        tested: true,
        success: result.success,
        message: result.message,
        type: 'mysql'
      });
    } catch (error) {
      setTestStatus({
        tested: true,
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        type: 'mysql'
      });
    }
    setIsLoading(false);
  };

  const getStatusColor = () => {
    if (!testStatus.tested) return '';
    if (!testStatus.success) return 'bg-red-900/50 text-red-400';
    return 'bg-green-900/50 text-green-400';
  };

  if (!isOpen) return null;

  const isFormValid = formData.name && formData.host && formData.port && 
                     formData.username && formData.database && 
                     (!formData.useSSH || (
                       formData.sshConfig?.host && 
                       formData.sshConfig?.port && 
                       formData.sshConfig?.username && 
                       (formData.sshConfig?.password || formData.sshConfig?.privateKey)
                     ));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">New Connection</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Connection Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Database</label>
            <input
              type="text"
              value={formData.database}
              onChange={e => setFormData(prev => ({ ...prev, database: e.target.value }))}
              className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, useSSH: !prev.useSSH }));
                setShowSSHDetails(!formData.useSSH);
              }}
              className="flex items-center space-x-2 text-sm font-medium text-gray-300 hover:text-gray-200"
            >
              {showSSHDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>Use SSH Tunnel</span>
            </button>

            {showSSHDetails && (
              <div className="space-y-4 border-l-2 border-gray-700 pl-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">SSH Host</label>
                    <input
                      type="text"
                      value={formData.sshConfig?.host}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        sshConfig: { ...prev.sshConfig!, host: e.target.value }
                      }))}
                      className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={formData.useSSH}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">SSH Port</label>
                    <input
                      type="text"
                      value={formData.sshConfig?.port}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        sshConfig: { ...prev.sshConfig!, port: e.target.value }
                      }))}
                      className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={formData.useSSH}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">SSH Username</label>
                  <input
                    type="text"
                    value={formData.sshConfig?.username}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      sshConfig: { ...prev.sshConfig!, username: e.target.value }
                    }))}
                    className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={formData.useSSH}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    SSH Password <span className="text-gray-400">(or use Private Key)</span>
                  </label>
                  <input
                    type="password"
                    value={formData.sshConfig?.password}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      sshConfig: { ...prev.sshConfig!, password: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Private Key <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    value={formData.sshConfig?.privateKey}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      sshConfig: { ...prev.sshConfig!, privateKey: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                    placeholder="Paste your private key here"
                  />
                </div>
              </div>
            )}
          </div>

          {testStatus.tested && (
            <div className={`p-3 rounded-md ${getStatusColor()}`}>
              {testStatus.type && <strong className="block mb-1">{testStatus.type.toUpperCase()} Connection:</strong>}
              {testStatus.message}
            </div>
          )}
        </form>

        <div className="flex justify-end space-x-3 p-4 border-t border-gray-700">
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
      </div>
    </div>
  );
}