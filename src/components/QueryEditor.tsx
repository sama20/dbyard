import React, { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion } from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';
import { ViewUpdate } from '@codemirror/view';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Connection } from '../types';

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  height: number;
  onResize: (height: number) => void;
  settings: any;
  backgroundColor?: string | null;
  activeConnection?: Connection;
}

export default function QueryEditor({ 
  value, 
  onChange, 
  height, 
  onResize, 
  settings, 
  backgroundColor,
  activeConnection 
}: QueryEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const tables = activeConnection?.databases?.flatMap(db => db.tables) || [];
    const tableCompletions = tables.map(table => ({
      label: table,
      type: 'table'
    }));

    const sqlCompletions = (context: any) => {
      let word = context.matchBefore(/\w*/);
      if (!word) return null;

      return {
        from: word.from,
        options: [
          ...tableCompletions,
          { label: "SELECT", type: "keyword" },
          { label: "FROM", type: "keyword" },
          { label: "WHERE", type: "keyword" },
          { label: "INSERT", type: "keyword" },
          { label: "UPDATE", type: "keyword" },
          { label: "DELETE", type: "keyword" },
          { label: "JOIN", type: "keyword" },
          { label: "GROUP BY", type: "keyword" },
          { label: "ORDER BY", type: "keyword" },
          { label: "LIMIT", type: "keyword" }
        ]
      };
    };

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        sql(),
        oneDark,
        autocompletion({ override: [sqlCompletions] }),
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': { fontSize: `${settings.fontSize}px` },
          '&.cm-editor.cm-focused': { outline: 'none' }
        })
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = undefined;
    };
  }, [activeConnection]);

  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value
        }
      });
    }
  }, [value]);

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

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onResize(isCollapsed ? 200 : 50);
  };

  return (
    <div style={{ height }} className="border-b border-gray-700 flex flex-col">
      <div className="bg-gray-800 text-xs px-4 py-1.5 border-b border-gray-700 text-gray-400 flex justify-between items-center">
        <span>Query Editor</span>
        <button
          onClick={toggleCollapse}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>
      <div 
        ref={editorRef}
        className={`w-full flex-1 overflow-auto transition-all duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}
        style={{ 
          backgroundColor: backgroundColor ? `${backgroundColor}10` : undefined,
          display: isCollapsed ? 'none' : 'block'
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div 
        className="h-1 bg-gray-800 cursor-row-resize hover:bg-blue-500 transition-colors"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}