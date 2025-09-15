import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { CellValueModal } from './CellValueModal';

interface ResultsTableProps {
  data?: any[];
  fields?: any[];
  error?: string;
  onUpdate?: (changes: any[]) => void;
}

export default function ResultsTable({ data, fields, error, onUpdate }: ResultsTableProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any[]>([]);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [modalValue, setModalValue] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setEditedData(JSON.parse(JSON.stringify(data)));
      resetEditState();
    }
  }, [data]);

  const resetEditState = () => {
    setEditMode(false);
    setSelectedCells(new Set());
    setHasChanges(false);
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-400 text-sm p-4">
        <div className="bg-red-900/20 p-4 rounded-lg max-w-2xl">
          {error}
        </div>
      </div>
    );
  }

  if (!data || !fields || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        No results to display
      </div>
    );
  }

  const isJoinQuery = () => {
    const tables = new Set(fields.map(f => f.table));
    return tables.size > 1;
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    if (!editMode) return;
    
    const cellKey = `${rowIndex}-${colIndex}`;
    const newSelected = new Set(selectedCells);
    
    if (newSelected.has(cellKey)) {
      newSelected.delete(cellKey);
    } else {
      newSelected.add(cellKey);
    }
    
    setSelectedCells(newSelected);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editMode || selectedCells.size === 0) return;

    // Handle paste
    if (e.ctrlKey && e.key === 'v') {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const newData = [...editedData];
        selectedCells.forEach(cell => {
          const [rowIndex, colIndex] = cell.split('-').map(Number);
          const fieldName = fields[colIndex].name;
          newData[rowIndex][fieldName] = text;
        });
        setEditedData(newData);
        setHasChanges(true);
      });
      return;
    }

    if (e.key === 'Backspace') {
      const newData = [...editedData];
      selectedCells.forEach(cell => {
        const [rowIndex, colIndex] = cell.split('-').map(Number);
        const fieldName = fields[colIndex].name;
        newData[rowIndex][fieldName] = null;
      });
      setEditedData(newData);
      setHasChanges(true);
    } else if (e.key.length === 1) {
    } else if (e.key === 'Enter') {
      setSelectedCells(new Set());
    }
  };

  const handleApplyChanges = () => {
    if (onUpdate) {
      const changes = editedData.filter((row, index) => {
        return JSON.stringify(row) !== JSON.stringify(data[index]);
      });
      onUpdate(changes);
    }
    resetEditState();
  };

  const handleCancel = () => {
    setEditedData(JSON.parse(JSON.stringify(data)));
    resetEditState();
  };

  // Helper to truncate long values
  const truncateValue = (value: string, maxLength = 40) => {
    if (value.length > maxLength) {
      return value.slice(0, maxLength) + '...';
    }
    return value;
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-2 border-b border-gray-700 flex items-center space-x-4">
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={editMode}
            onChange={(e) => {
              setEditMode(e.target.checked);
              if (!e.target.checked) {
                resetEditState();
              }
            }}
            disabled={isJoinQuery()}
            className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700"
          />
          <span className="text-gray-300">Edit Mode</span>
        </label>
        {hasChanges && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleApplyChanges}
              className="flex items-center space-x-1 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Save size={14} />
              <span>Apply Changes</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-1 px-2 py-1 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <div 
          className="h-full overflow-auto scrollbar-thin" 
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
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
              {editedData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-800/50">
                  {fields.map((field, j) => {
                    const cellValue = row[field.name]?.toString() ?? 'NULL';
                    const isLong = cellValue.length > 40;
                    return (
                      <td 
                        key={j} 
                        className={`p-2 text-xs text-gray-300 whitespace-nowrap border-b border-gray-700/50 first:pl-4 ${
                          editMode ? 'cursor-pointer select-none' : ''
                        } ${
                          selectedCells.has(`${i}-${j}`) ? 'bg-blue-500/20' : ''
                        }`}
                        onClick={() => {
                          handleCellClick(i, j);
                          if (!editMode && isLong) setModalValue(cellValue);
                        }}
                        style={isLong ? { cursor: 'pointer', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } : {}}
                        title={isLong ? 'Click to view full value' : undefined}
                      >
                        {isLong ? truncateValue(cellValue) : cellValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {modalValue && (
          <CellValueModal value={modalValue} onClose={() => setModalValue(null)} />
        )}
      </div>
    </div>
  );
}