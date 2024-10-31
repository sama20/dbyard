import React from 'react';

interface ResultsTableProps {
  data?: any[];
  fields?: any[];
}

export default function ResultsTable({ data, fields }: ResultsTableProps) {
  if (!data || !fields || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        No results to display
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto scrollbar-thin">
          <table className="w-full border-separate border-spacing-0 min-w-max">
            <thead className="sticky top-0 z-10">
              <tr>
                {fields.map((field, index) => (
                  <th 
                    key={index} 
                    className="bg-gray-800 text-left p-2 text-xs font-medium text-gray-300 whitespace-nowrap border-b border-gray-700 first:pl-4"
                  >
                    {field.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-800/50">
                  {fields.map((field, j) => (
                    <td 
                      key={j} 
                      className="p-2 text-xs text-gray-300 whitespace-nowrap border-b border-gray-700/50 first:pl-4"
                    >
                      {row[field.name]?.toString() ?? 'NULL'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}