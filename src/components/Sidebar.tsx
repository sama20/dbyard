import React from 'react';
import { Database, Table2, FolderOpen } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-800 flex flex-col shrink-0 border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Database size={20} className="text-blue-400" />
          <span className="font-semibold text-gray-100">Databases</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="p-2">
          <div className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer group">
            <FolderOpen size={16} className="text-yellow-500" />
            <span className="text-gray-200 group-hover:text-white">project_db</span>
          </div>
          
          <div className="ml-4">
            <div className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer group">
              <Table2 size={16} className="text-blue-400" />
              <span className="text-gray-300 group-hover:text-white">users</span>
            </div>
            <div className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer group">
              <Table2 size={16} className="text-blue-400" />
              <span className="text-gray-300 group-hover:text-white">products</span>
            </div>
            <div className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer group">
              <Table2 size={16} className="text-blue-400" />
              <span className="text-gray-300 group-hover:text-white">orders</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}