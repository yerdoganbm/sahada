/**
 * ProviderBadge — Shows data provider mode (Firebase/Mock)
 * Mirrors web components/ProviderBadge.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface ProviderBadgeProps {
  mode?: 'firebase' | 'mock';
}

export default function ProviderBadge({ mode = 'mock' }: ProviderBadgeProps) {
  const isFirebase = mode === 'firebase';

  return (
    <View style={[styles.badge, isFirebase ? styles.firebase : styles.mock]}>
      <Icon name={isFirebase ? 'firebase' : 'test-tube'} size={12} color={isFirebase ? '#F59E0B' : '#94a3b8'} />
      <Text style={[styles.text, isFirebase ? styles.firebaseText : styles.mockText]}>
        {isFirebase ? 'Firebase' : 'Mock'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  firebase: { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)' },
  mock: { backgroundColor: 'rgba(100,116,139,0.1)', borderColor: 'rgba(100,116,139,0.2)' },
  text: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  firebaseText: { color: '#F59E0B' },
  mockText: { color: '#94a3b8' },
});
