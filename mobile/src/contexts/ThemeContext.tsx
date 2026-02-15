/**
 * Theme Context
 * Provides theme to all components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { theme, Theme } from '../theme';

const ThemeContext = createContext<Theme>(theme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
