/**
 * Theme Context – Açık/Koyu tema desteği
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, colorsDark, colorsLight } from '../theme';

const THEME_STORAGE_KEY = '@sahada_theme';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: typeof colorsDark;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  colors: colorsDark,
  setMode: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const colors = mode === 'dark' ? colorsDark : colorsLight;

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
  }, []);

  const value: ThemeContextValue = {
    mode,
    colors,
    setMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      ...theme,
      colors: colorsDark,
      mode: 'dark' as ThemeMode,
      setMode: async (_: ThemeMode) => {},
    };
  }
  return context;
}
