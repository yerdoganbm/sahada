/**
 * Admin Dashboard Screen - Yönetim paneli özeti (Firestore)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { canAccessAdminPanel } from '../utils/permissions';
import { getPlayers } from '../services/players';
import { getMatches } from '../services/matches';
import { getPayments } from '../services/finance';
import { colors, spacing, borderRadius, typography } from '../theme';
import AppScrollView from '../components/AppScrollView';
import { RootStackParamList } from '../types';

type AdminNavProp = StackNavigationProp<RootStackParamList, 'Admin'>;

function MenuRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <Icon name={icon as any} size={22} color={colors.primary} />
      <Text style={styles.menuText}>{label}</Text>
      <Icon name="chevron-right" size={22} color={colors.text.secondary} />
    </TouchableOpacity>
  );
}

export default function AdminDashboardScreen() {
  const navigation = useNavigation<AdminNavProp>();
  const { user } = useAuth();
  const isAdmin = canAccessAdminPanel(user);
  const [stats, setStats] = useState({ members: 0, matches: 0, pending: 0 });

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    const { getTeamIdForUser } = await import('../services/players');
    const teamId = await getTeamIdForUser(user.id);
    if (!teamId) return;
    const [players, matches, payments] = await Promise.all([
      getPlayers({ teamId }),
      getMatches({ teamId }),
      getPayments({ teamId, status: 'PENDING' }),
    ]);
    setStats({
      members: players.length,
      matches: matches.length,
      pending: payments.length,
    });
  }, [user?.id]);

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin, fetchStats]);

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
    <AppScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yönetim Paneli</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
            <Icon name="account-group" size={24} color={colors.primary} />
          </View>
          <Text style={styles.statValue}>{stats.members}</Text>
          <Text style={styles.statLabel}>Üye</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.info + '20' }]}>
            <Icon name="soccer" size={24} color={colors.info} />
          </View>
          <Text style={styles.statValue}>{stats.matches}</Text>
          <Text style={styles.statLabel}>Maç</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
            <Icon name="clock-outline" size={24} color={colors.warning} />
          </View>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Bekleyen</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
      <View style={styles.menu}>
        <MenuRow icon="account-cog" label="Üye Yönetimi" onPress={() => navigation.navigate('MemberManagement')} />
        <MenuRow icon="account-plus" label="Kadro" onPress={() => navigation.dispatch(CommonActions.navigate('MainTabs', { screen: 'Team' }))} />
        <MenuRow icon="soccer" label="Maç Oluştur" onPress={() => navigation.navigate('MatchCreate')} />
        <MenuRow icon="chart-bar" label="Finansal Rapor" onPress={() => navigation.navigate('FinancialReports')} />
        <MenuRow icon="cash-minus" label="Borç Listesi" onPress={() => navigation.navigate('DebtList')} />
        <MenuRow icon="format-list-checks" label="Kadro Yöneticisi" onPress={() => navigation.navigate('LineupManager')} />
        <MenuRow icon="binoculars" label="Scout Paneli" onPress={() => navigation.navigate('ScoutDashboard')} />
        <MenuRow icon="whatsapp" label="WhatsApp" onPress={() => navigation.navigate('WhatsAppIntegration')} />
        <MenuRow icon="receipt-text" label="Ödeme Defteri" onPress={() => navigation.navigate('PaymentLedger')} />
        <MenuRow icon="forum" label="Takım Chat" onPress={() => navigation.navigate('TeamChat')} />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Diğer</Text>
      <View style={styles.menu}>
        <MenuRow icon="star-circle" label="Yetenek Havuzu" onPress={() => navigation.navigate('TalentPool')} />
        <MenuRow icon="file-document-search" label="Scout Raporları" onPress={() => navigation.navigate('ScoutReports')} />
        <MenuRow icon="domain" label="Saha Sahibi Paneli" onPress={() => navigation.navigate('VenueOwnerDashboard')} />
        <MenuRow icon="chart-line" label="Saha Finansal Rapor" onPress={() => navigation.navigate('VenueFinancialReports')} />
        <MenuRow icon="calendar-edit" label="Rezervasyon Yönetimi" onPress={() => navigation.navigate('ReservationManagement')} />
        <MenuRow icon="account-tie" label="Müşteri Yönetimi" onPress={() => navigation.navigate('CustomerManagement')} />
        <MenuRow icon="plus-circle" label="Saha Ekle" onPress={() => navigation.navigate('VenueAdd')} />
        <MenuRow icon="calendar-check" label="Rezervasyon Sistemi" onPress={() => navigation.navigate('ReserveSystem')} />
        <MenuRow icon="share-variant" label="Kadro Paylaşım" onPress={() => navigation.navigate('SquadShareWizard')} />
        <MenuRow icon="message-text" label="Mesaj Kayıtları" onPress={() => navigation.navigate('MessageLogs')} />
        <MenuRow icon="account-plus" label="Profil Oluştur" onPress={() => navigation.navigate('CreateProfile')} />
        <MenuRow icon="clipboard-check" label="Yoklama" onPress={() => navigation.navigate('Attendance')} />
        <MenuRow icon="calendar-month" label="Takvim" onPress={() => navigation.navigate('VenueCalendar')} />
      </View>
    </AppScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: { paddingBottom: 100 },
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
