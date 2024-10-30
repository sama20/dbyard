import React from 'react';
import { Clock, Database, AlertCircle, Table2 } from 'lucide-react';

interface QueryInfoProps {
  queryResult?: {
    executionTime: number;
    rowsAffected: number;
    fields?: Array<{
      name: string;
      type: string;
      length: number;
      flags: number;
    }>;
  };
}

export default function QueryInfo({ queryResult }: QueryInfoProps) {
  if (!queryResult) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        No query information available
      </div>
    );
  }

  return (
    <div className="p-4 text-sm space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Clock size={16} className="text-blue-400" />
            <h3 className="font-medium text-gray-200">Execution Time</h3>
          </div>
          <p className="text-2xl font-mono text-gray-100">{queryResult.executionTime.toFixed(2)}ms</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Database size={16} className="text-green-400" />
            <h3 className="font-medium text-gray-200">Rows Affected</h3>
          </div>
          <p className="text-2xl font-mono text-gray-100">{queryResult.rowsAffected}</p>
        </div>
      </div>

      {queryResult.fields && queryResult.fields.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Table2 size={16} className="text-blue-400" />
            <h3 className="font-medium text-gray-200">Column Information</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-2 font-medium text-gray-300">Name</th>
                  <th className="pb-2 font-medium text-gray-300">Type</th>
                  <th className="pb-2 font-medium text-gray-300">Length</th>
                </tr>
              </thead>
              <tbody>
                {queryResult.fields.map((field, index) => (
                  <tr key={index} className="border-b border-gray-700/50">
                    <td className="py-2 text-blue-400">{field.name}</td>
                    <td className="py-2 text-gray-300">{field.type}</td>
                    <td className="py-2 text-gray-400">{field.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}