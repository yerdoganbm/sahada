/**
 * Placeholder screens for navigation
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>Yakında...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
});

export const MatchDetailsScreen = () => <PlaceholderScreen title="Maç Detayları" />;
export const VenueDetailsScreen = () => <PlaceholderScreen title="Saha Detayları" />;
export const SettingsScreen = () => <PlaceholderScreen title="Ayarlar" />;
export const TeamSetupScreen = () => <PlaceholderScreen title="Takım Kurulumu" />;
export const MatchCreateScreen = () => <PlaceholderScreen title="Maç Oluştur" />;
export const AdminDashboardScreen = () => <PlaceholderScreen title="Yönetim Paneli" />;

export default PlaceholderScreen;
