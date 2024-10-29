import React from 'react';

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function QueryEditor({ value, onChange }: QueryEditorProps) {
  return (
    <div className="h-64 border-b border-gray-700 flex flex-col">
      <div className="bg-gray-800 text-xs px-4 py-1.5 border-b border-gray-700 text-gray-400">
        Query Editor
      </div>
      <textarea
        className="w-full flex-1 bg-gray-900 text-gray-100 p-4 resize-none focus:outline-none font-mono text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="Enter your SQL query here..."
      />
    </div>
  );
}