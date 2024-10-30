export interface QueryTab {
  id: string;
  title: string;
  query: string;
}

export type Theme = 'dark' | 'light';

export interface ConnectionData {
  name: string;
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
}

export interface Connection extends ConnectionData {
  id: string;
  isExpanded?: boolean;
  databases?: Database[];
}

export interface Database {
  name: string;
  isExpanded?: boolean;
  tables: string[];
}