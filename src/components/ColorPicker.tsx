import { useEffect, useRef } from 'react';

interface ColorPickerProps {
  position: { x: number; y: number };
  colors: Array<{ label: string; value: string }>;
  onSelect: (color: string) => void;
  onClose: () => void;
}

export default function ColorPicker({ position, colors, onSelect, onClose }: ColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-2"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="space-y-1">
        {colors.map(color => (
          <button
            key={color.value}
            onClick={() => onSelect(color.value)}
            className="flex items-center space-x-2 w-full px-3 py-1.5 hover:bg-gray-700 rounded text-left"
          >
            {color.value && (
              <div
                className="w-4 h-4 rounded border border-gray-600"
                style={{ backgroundColor: color.value }}
              />
            )}
            <span className="text-sm text-gray-200">{color.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}