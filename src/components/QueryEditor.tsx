import React from 'react';

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  height: number;
  onResize: (height: number) => void;
  settings: any;
  backgroundColor?: string | null;
}

export default function QueryEditor({ value, onChange, height, onResize, settings, backgroundColor }: QueryEditorProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - startY;
      onResize(Math.max(100, startHeight + delta));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div style={{ height }} className="border-b border-gray-700 flex flex-col">
      <div className="bg-gray-800 text-xs px-4 py-1.5 border-b border-gray-700 text-gray-400">
        Query Editor
      </div>
      <textarea
        className="w-full flex-1 bg-gray-900 text-gray-100 p-4 resize-none focus:outline-none font-mono text-sm"
        style={{ backgroundColor: backgroundColor ? `${backgroundColor}10` : undefined }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="Enter your SQL query here..."
        onContextMenu={(e) => e.preventDefault()}
      />
      <div 
        className="h-1 bg-gray-800 cursor-row-resize hover:bg-blue-500 transition-colors"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}