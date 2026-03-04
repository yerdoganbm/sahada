/**
 * Maintenance Center - Bakim & Ariza (web ile uyumlu)
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'MaintenanceCenter'>;

export default function MaintenanceCenterScreen() {
  const navigation = useNavigation<NavProp>();
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Icon name="arrow-left" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Icon name="wrench" size={48} color={colors.primary} style={styles.icon} />
      <Text style={styles.title}>Bakim & Ariza</Text>
      <Text style={styles.subtitle}>Bakim merkezi web ile senkron.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary, paddingTop: 50, padding: spacing.lg, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 50, left: spacing.lg, width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  icon: { marginTop: 24 },
  title: { fontSize: typography.fontSize.xxl, fontWeight: '800', color: colors.text.primary, marginTop: spacing.md },
  subtitle: { marginTop: 8, fontSize: 14, color: colors.text.secondary, textAlign: 'center' },
});
