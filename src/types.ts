export interface QueryTab {
  id: string;
  title: string;
  query: string;
  connectionId?: string;
  database?: string;
}

export type Theme = 'dark' | 'light';

export interface ConnectionData {
  name: string;
  host: string;
  port: string;
  username: string;
  password: string;
  database?: string;
  sshConfig?: {
    host: string;
    port: string;
    username: string;
    password?: string;
    privateKey?: string;
  };
}

export interface Connection extends ConnectionData {
  id: string;
  isExpanded?: boolean;
  databases?: Database[];
  color?: string;
}

export interface Database {
  name: string;
  isExpanded?: boolean;
  tables: string[];
}

export interface SavedQuery {
  id: string;
  name: string;
  query: string;
  createdAt: number;
}

export interface Connection {
  id: string;
  color?: string;
  // Add other connection properties
}

export interface QueryTab {
  id: string;
  title: string;
  query: string;
  connectionId?: string;
  database?: string;
}

export interface QueryResult {
  fields: Array<{ name: string; flags: number }>;
  // Add other result properties
}

export interface Settings {
  defaultLimit: number;
  // Add other settings
}