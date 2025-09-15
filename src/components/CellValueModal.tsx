import React from 'react';
import { X } from 'lucide-react';

interface CellValueModalProps {
  value: string;
  onClose: () => void;
}

export const CellValueModal: React.FC<CellValueModalProps> = ({ value, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-xl w-full relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        title="Close"
      >
        <X size={20} />
      </button>
      <div className="text-gray-100 break-words whitespace-pre-wrap text-sm max-h-[60vh] overflow-auto">
        {value}
      </div>
    </div>
  </div>
);
