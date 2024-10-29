import React from 'react';
import { Clock, Database, AlertCircle } from 'lucide-react';

export default function QueryInfo() {
  const mockInfo = {
    executionTime: '123ms',
    rowsAffected: 2,
    cached: false,
    warnings: [],
    explain: [
      { operation: 'Seq Scan on users', cost: '0.00..1.14', rows: 14, width: 622 }
    ]
  };

  return (
    <div className="p-4 text-sm space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Clock size={16} className="text-blue-400" />
            <h3 className="font-medium text-gray-200">Execution Time</h3>
          </div>
          <p className="text-2xl font-mono text-gray-100">{mockInfo.executionTime}</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Database size={16} className="text-green-400" />
            <h3 className="font-medium text-gray-200">Rows Affected</h3>
          </div>
          <p className="text-2xl font-mono text-gray-100">{mockInfo.rowsAffected}</p>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium text-gray-200 mb-3">Query Plan</h3>
        <div className="font-mono text-xs text-gray-300">
          {mockInfo.explain.map((step, i) => (
            <div key={i} className="mb-2">
              <div className="text-blue-400">{step.operation}</div>
              <div className="ml-4 text-gray-400">
                <div>Cost: {step.cost}</div>
                <div>Rows: {step.rows}</div>
                <div>Width: {step.width}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {mockInfo.warnings.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle size={16} className="text-yellow-400" />
            <h3 className="font-medium text-gray-200">Warnings</h3>
          </div>
          <ul className="text-yellow-200 space-y-1">
            {mockInfo.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}