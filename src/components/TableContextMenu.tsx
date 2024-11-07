import React from 'react';
import { Edit, Trash2, RefreshCw, Download, Upload } from 'lucide-react';
import type { Connection } from '../types';

interface TableContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  connection: Connection;
  database: string;
  table: string;
  onAction: (action: string) => void;
}

export default function TableContextMenu({ 
  position, 
  onClose, 
  connection,
  database,
  table,
  onAction 
}: TableContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const actions = [
    { id: 'edit', icon: Edit, label: 'Edit Table', color: 'text-blue-400' },
    { id: 'truncate', icon: RefreshCw, label: 'Truncate Table', color: 'text-yellow-400' },
    { id: 'drop', icon: Trash2, label: 'Drop Table', color: 'text-red-400' },
    { id: 'export', icon: Download, label: 'Export Data', color: 'text-green-400' },
    { id: 'import', icon: Upload, label: 'Import Data', color: 'text-purple-400' }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 min-w-[160px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {actions.map(({ id, icon: Icon, label, color }) => (
        <button
          key={id}
          onClick={() => {
            onAction(id);
            onClose();
          }}
          className="flex items-center space-x-2 w-full px-3 py-1.5 hover:bg-gray-700 text-left"
        >
          <Icon size={14} className={color} />
          <span className="text-sm text-gray-200">{label}</span>
        </button>
      ))}
    </div>
  );
}