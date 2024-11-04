import { useCallback } from 'react';
import { executeQuery } from '../services/mysql';
import type { Connection, QueryResult } from '../types';

export const useDataUpdater = () => {
  const updateData = useCallback(async (
    connection: Connection,
    database: string,
    query: string,
    queryResult: QueryResult,
    changes: any[]
  ) => {
    const tableMatch = query.match(/FROM\s+`?(\w+)`?/i);
    if (!tableMatch) {
      throw new Error('Could not determine table name from query');
    }

    const tableName = tableMatch[1];
    const primaryKeyField = queryResult.fields.find(f => f.flags & 2);

    if (!primaryKeyField) {
      throw new Error('No primary key found in the result set');
    }

    for (const row of changes) {
      const setClauses = Object.keys(row)
        .filter(key => key !== primaryKeyField.name)
        .map(key => `${key} = ${row[key] === null ? 'NULL' : `'${row[key]}'`}`)
        .join(', ');

      const updateQuery = `UPDATE ${tableName} SET ${setClauses} WHERE ${primaryKeyField.name} = '${row[primaryKeyField.name]}'`;
      await executeQuery({ ...connection, database }, updateQuery);
    }
  }, []);

  return { updateData };
};