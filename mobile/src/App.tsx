/**
 * Sahada Mobile - React Native App
 * Main Application Entry Point
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';

import RootNavigator from './navigation/RootNavigator';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { linking } from './navigation/linking';

function AppContent(): React.JSX.Element {
  const { mode, colors } = useTheme();
  const isDark = mode === 'dark';
  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background.primary}
        translucent
      />
      <NavigationContainer
        linking={linking}
        theme={{
          dark: isDark,
          colors: {
            primary: colors.primary,
            background: colors.background.primary,
            card: colors.background.secondary,
            text: colors.text.primary,
            border: colors.border?.light ?? 'rgba(255,255,255,0.1)',
            notification: colors.primary,
          },
        }}
      >
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
