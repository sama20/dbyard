// src/hooks/useDatabaseContext.ts
import { useState, useCallback } from 'react';

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
}

export interface TableSchema {
  name: string;
  columns: TableColumn[];
  connection: string;
}

export interface DatabaseContext {
  id: string;
  type: 'database' | 'table';
  name: string;
  connection?: string;
  schema?: TableSchema;
}

export const useDatabaseContext = () => {
  const [contexts, setContexts] = useState<DatabaseContext[]>([]);

  const addTableContext = useCallback((tableName: string, connectionName: string, columns?: TableColumn[]) => {
    const newContext: DatabaseContext = {
      id: `${connectionName}-${tableName}-${Date.now()}`,
      type: 'table',
      name: tableName,
      connection: connectionName,
      schema: columns ? {
        name: tableName,
        columns,
        connection: connectionName
      } : undefined
    };

    setContexts(prev => {
      // Remove any existing context for the same table
      const filtered = prev.filter(ctx => !(ctx.name === tableName && ctx.connection === connectionName));
      return [...filtered, newContext];
    });
  }, []);

  const addDatabaseContext = useCallback((dbName: string, connectionName: string) => {
    const newContext: DatabaseContext = {
      id: `${connectionName}-${dbName}-${Date.now()}`,
      type: 'database',
      name: dbName,
      connection: connectionName
    };

    setContexts(prev => {
      // Remove any existing context for the same database
      const filtered = prev.filter(ctx => !(ctx.name === dbName && ctx.connection === connectionName && ctx.type === 'database'));
      return [...filtered, newContext];
    });
  }, []);

  const removeContext = useCallback((id: string) => {
    setContexts(prev => prev.filter(ctx => ctx.id !== id));
  }, []);

  const clearContexts = useCallback(() => {
    setContexts([]);
  }, []);

  const getContextDescription = useCallback(() => {
    if (contexts.length === 0) return 'No database context available';
    
    const databases = contexts.filter(ctx => ctx.type === 'database');
    const tables = contexts.filter(ctx => ctx.type === 'table');
    
    let description = '';
    
    if (databases.length > 0) {
      description += `Databases: ${databases.map(db => db.name).join(', ')}. `;
    }
    
    if (tables.length > 0) {
      description += `Tables: ${tables.map(table => {
        if (table.schema && table.schema.columns.length > 0) {
          return `${table.name} (${table.schema.columns.map(col => `${col.name}: ${col.type}`).join(', ')})`;
        }
        return table.name;
      }).join(', ')}.`;
    }
    
    return description;
  }, [contexts]);

  return {
    contexts,
    addTableContext,
    addDatabaseContext,
    removeContext,
    clearContexts,
    getContextDescription
  };
};
