import { useEffect, useState } from 'react';

export function usePersistedState(key: string, defaultValue: boolean) {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : raw === 'true';
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // localStorage unavailable — state just won't persist across reloads
    }
  }, [key, value]);

  return [value, setValue] as const;
}
