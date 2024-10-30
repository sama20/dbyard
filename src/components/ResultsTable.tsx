import React from 'react';

interface ResultsTableProps {
  data?: any[];
  fields?: any[];
}

export default function ResultsTable({ data, fields }: ResultsTableProps) {
  if (!data || !fields || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        No results to display
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4 flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {fields.map((field, index) => (
                <th key={index} className="text-left p-2 border-b border-gray-700 bg-gray-800 text-gray-300 font-medium sticky top-0">
                  {field.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-800">
                {fields.map((field, j) => (
                  <td key={j} className="p-2 border-b border-gray-700 text-gray-300">
                    {row[field.name]?.toString() ?? 'NULL'}
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