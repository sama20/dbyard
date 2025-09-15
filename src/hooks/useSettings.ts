import { usePersistentState } from './usePersistentState';

export interface Settings {
  defaultLimit: number;
  theme: 'dark' | 'light';
  fontSize: number;
  showLineNumbers: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  defaultLimit: 100,
  theme: 'dark',
  fontSize: 14,
  showLineNumbers: true,
};

export function useSettings() {
  const [settings, setSettings] = usePersistentState<Settings>('db_settings', DEFAULT_SETTINGS);
  return { settings, setSettings };
}