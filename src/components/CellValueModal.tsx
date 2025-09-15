import React from 'react';
import { X } from 'lucide-react';

interface CellValueModalProps {
  value: string;
  onClose: () => void;
}

export const CellValueModal: React.FC<CellValueModalProps> = ({ value, onClose }) => {
  const [tab, setTab] = React.useState<'txt' | 'json' | 'html'>('txt');

  let displayValue: React.ReactNode = value;
  if (tab === 'json') {
    try {
      displayValue = <pre>{JSON.stringify(JSON.parse(value), null, 2)}</pre>;
    } catch {
      displayValue = <span className="text-red-400">Not valid JSON</span>;
    }
  } else if (tab === 'html') {
    // Try to detect if value is valid HTML, otherwise show as text
    const isLikelyHtml = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/.test(value.trim());
    if (isLikelyHtml) {
      displayValue = <div className="bg-gray-950 p-2 rounded" dangerouslySetInnerHTML={{ __html: value }} />;
    } else {
      displayValue = <div className="text-yellow-400">Not valid HTML. Showing as text:</div>;
      displayValue = <div className="whitespace-pre-wrap">{value}</div>;
    }
  } else {
    displayValue = <div className="whitespace-pre-wrap">{value}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-xl w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          title="Close"
        >
          <X size={20} />
        </button>
        <div className="mb-4 flex space-x-2 border-b border-gray-700 pb-2">
          <button
            className={`px-3 py-1 rounded text-xs font-medium ${tab === 'txt' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300'}`}
            onClick={() => setTab('txt')}
          >txt</button>
          <button
            className={`px-3 py-1 rounded text-xs font-medium ${tab === 'json' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300'}`}
            onClick={() => setTab('json')}
          >json</button>
          <button
            className={`px-3 py-1 rounded text-xs font-medium ${tab === 'html' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300'}`}
            onClick={() => setTab('html')}
          >html</button>
        </div>
        <div className="text-gray-100 break-words text-sm max-h-[60vh] overflow-auto">
          {displayValue}
        </div>
      </div>
    </div>
  );
};
