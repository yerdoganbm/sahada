/**
 * Admin Dashboard Screen - Yönetim paneli özeti
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../theme';
import { RootStackParamList } from '../types';

type AdminNavProp = StackNavigationProp<RootStackParamList, 'Admin'>;

const STATS = [
  { label: 'Üye', value: '14', icon: 'account-group', color: colors.primary },
  { label: 'Maç', value: '3', icon: 'soccer', color: colors.info },
  { label: 'Bekleyen', value: '2', icon: 'clock-outline', color: colors.warning },
];

export default function AdminDashboardScreen() {
  const navigation = useNavigation<AdminNavProp>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yönetim</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centered}>
          <Icon name="lock" size={48} color={colors.alert} />
          <Text style={styles.lockText}>Sadece yöneticiler erişebilir.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yönetim Paneli</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsRow}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: s.color + '20' }]}>
              <Icon name={s.icon as any} size={24} color={s.color} />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            navigation.dispatch(
              CommonActions.navigate('MainTabs', { screen: 'Team' })
            )
          }
        >
          <Icon name="account-plus" size={22} color={colors.primary} />
          <Text style={styles.menuText}>Üye Yönetimi</Text>
          <Icon name="chevron-right" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('MatchCreate')}
        >
          <Icon name="soccer" size={22} color={colors.primary} />
          <Text style={styles.menuText}>Maç Oluştur</Text>
          <Icon name="chevron-right" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(
              'Finansal Rapor',
              'Bu özellik yakında eklenecek.',
              [{ text: 'Tamam' }]
            )
          }
        >
          <Icon name="cash" size={22} color={colors.primary} />
          <Text style={styles.menuText}>Finansal Rapor</Text>
          <Icon name="chevron-right" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  placeholder: { width: 40 },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
  },
  menu: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  lockText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});
