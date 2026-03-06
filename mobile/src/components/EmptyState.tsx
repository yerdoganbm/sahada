/**
 * EmptyState — React Native empty state component
 * Mirrors web components/EmptyState.tsx
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'info' | 'warning';
}

const variantColors = {
  default: { icon: '#94a3b8', bg: 'rgba(100,116,139,0.1)' },
  info: { icon: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
  warning: { icon: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
};

export default function EmptyState({ icon, title, description, actionLabel, onAction, variant = 'default' }: EmptyStateProps) {
  const v = variantColors[variant];

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: v.bg }]}>
        <Icon name={icon as any} size={40} color={v.icon} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.8} style={styles.btn}>
          <Icon name="plus" size={18} color={colors.secondary} />
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  desc: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 24, maxWidth: 280 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { fontSize: 13, fontWeight: '700', color: colors.secondary },
});
