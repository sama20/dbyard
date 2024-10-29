import React from 'react';
import { Play, RefreshCw, Terminal, Plus } from 'lucide-react';

export default function Toolbar() {
  return (
    <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 space-x-2 shrink-0">
      <button className="p-1.5 hover:bg-gray-700 rounded text-green-400 hover:text-green-300 transition-colors" title="Execute Query">
        <Play size={18} />
      </button>
      <button className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors" title="Refresh">
        <RefreshCw size={18} />
      </button>
      <div className="h-5 w-px bg-gray-700 mx-2" />
      <button className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors" title="Open Console">
        <Terminal size={18} />
      </button>
      <button className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors" title="New Query">
        <Plus size={18} />
      </button>
    </div>
  );
}