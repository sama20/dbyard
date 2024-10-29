import React from 'react';

export default function ResultsTable() {
  const mockData = [
    { id: 1, username: 'john_doe', email: 'john@example.com', created_at: '2024-03-15' },
    { id: 2, username: 'jane_smith', email: 'jane@example.com', created_at: '2024-03-14' },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="bg-gray-800 text-xs px-4 py-1.5 border-b border-gray-700 text-gray-400">
        Results
      </div>
      <div className="p-4 flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {Object.keys(mockData[0]).map((key) => (
                <th key={key} className="text-left p-2 border-b border-gray-700 bg-gray-800 text-gray-300 font-medium sticky top-0">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-800">
                {Object.values(row).map((value, j) => (
                  <td key={j} className="p-2 border-b border-gray-700 text-gray-300">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}