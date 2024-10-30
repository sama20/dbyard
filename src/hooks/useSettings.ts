import { useState, useEffect } from 'react';

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
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('db_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('db_settings', JSON.stringify(settings));
  }, [settings]);

  return { settings, setSettings };
}