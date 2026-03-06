/**
 * LoadingSpinner — React Native loading indicator
 * Mirrors web components/LoadingSpinner.tsx
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  fullScreen?: boolean;
  message?: string;
}

const sizeMap = { sm: 'small' as const, md: 'large' as const, lg: 'large' as const };

export default function LoadingSpinner({ size = 'md', color, fullScreen = false, message }: LoadingSpinnerProps) {
  const spinnerColor = color || colors.primary;

  const content = (
    <View style={styles.inner}>
      <ActivityIndicator size={sizeMap[size]} color={spinnerColor} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return content;
}

const styles = StyleSheet.create({
  inner: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  message: { fontSize: 13, color: '#94a3b8' },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    backgroundColor: 'rgba(11,15,26,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
