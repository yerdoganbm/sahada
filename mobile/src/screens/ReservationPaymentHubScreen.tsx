/**
 * ReservationPaymentHubScreen – Kaptan ödeme merkezi
 * Sekmeler: Contributions, Outbox, Pay Venue, Ledger, Summary
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AppScrollView from '../components/AppScrollView';
import { colors, spacing, borderRadius, typography } from '../theme';

type TabKey = 'contributions' | 'outbox' | 'payVenue' | 'ledger' | 'summary';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'contributions', label: 'Katılım', icon: 'account-group' },
  { key: 'outbox', label: 'Outbox', icon: 'send' },
  { key: 'payVenue', label: 'Saha Öde', icon: 'cash-register' },
  { key: 'ledger', label: 'Defter', icon: 'book-open-variant' },
  { key: 'summary', label: 'Özet', icon: 'chart-pie' },
];

interface Member {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
}

const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'Ahmet Yılmaz', amount: 150, paid: true },
  { id: '2', name: 'Mehmet Kaya', amount: 150, paid: true },
  { id: '3', name: 'Can Demir', amount: 150, paid: false },
  { id: '4', name: 'Ali Öztürk', amount: 150, paid: false },
  { id: '5', name: 'Emre Çelik', amount: 150, paid: true },
  { id: '6', name: 'Burak Şahin', amount: 150, paid: false },
];

const MOCK_LEDGER = [
  { id: '1', desc: 'Ahmet Yılmaz ödeme', amount: 150, type: 'in' as const, date: '2025-03-01' },
  { id: '2', desc: 'Mehmet Kaya ödeme', amount: 150, type: 'in' as const, date: '2025-03-01' },
  { id: '3', desc: 'Emre Çelik ödeme', amount: 150, type: 'in' as const, date: '2025-03-02' },
  { id: '4', desc: 'Saha ücreti ödendi', amount: -600, type: 'out' as const, date: '2025-03-03' },
];

export default function ReservationPaymentHubScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('contributions');
  const [venuePayAmount, setVenuePayAmount] = useState('');

  const totalExpected = MOCK_MEMBERS.reduce((s, m) => s + m.amount, 0);
  const totalPaid = MOCK_MEMBERS.filter((m) => m.paid).reduce((s, m) => s + m.amount, 0);
  const collectionPct = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

  const renderContributions = () => (
    <View>
      <Text style={styles.sectionLabel}>KATILIMCILAR</Text>
      {MOCK_MEMBERS.map((member) => (
        <View key={member.id} style={styles.memberCard}>
          <View style={[styles.memberAvatar, { backgroundColor: member.paid ? `${colors.success}20` : `${colors.warning}20` }]}>
            <Icon
              name={member.paid ? 'check-circle' : 'clock-outline'}
              size={20}
              color={member.paid ? colors.success : colors.warning}
            />
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberStatus}>
              {member.paid ? 'Ödendi' : 'Bekliyor'}
            </Text>
          </View>
          <View style={styles.memberRight}>
            <Text style={styles.memberAmount}>₺{member.amount}</Text>
            <View style={[styles.statusDot, { backgroundColor: member.paid ? colors.success : colors.warning }]} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderOutbox = () => (
    <View>
      <Text style={styles.sectionLabel}>HATIRLATMA MESAJLARI</Text>
      <View style={styles.emptyCard}>
        <Icon name="send-check" size={48} color={colors.text.tertiary} />
        <Text style={styles.emptyText}>Gönderilmemiş mesaj yok</Text>
        <Text style={styles.emptySubText}>
          Ödeme yapmayan üyelere hatırlatma gönderin
        </Text>
      </View>
      <TouchableOpacity style={styles.primaryButton}>
        <Icon name="send" size={18} color="#fff" />
        <Text style={styles.primaryButtonText}>Hatırlatma Gönder</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPayVenue = () => (
    <View>
      <Text style={styles.sectionLabel}>SAHA ÖDEMESİ</Text>
      <View style={styles.venuePayCard}>
        <View style={styles.venuePayHeader}>
          <Icon name="stadium-variant" size={24} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.venuePayTitle}>Yıldız Halısaha</Text>
            <Text style={styles.venuePaySub}>Toplam: ₺600</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <Text style={styles.inputLabel}>Ödeme Tutarı (₺)</Text>
        <TextInput
          style={styles.input}
          value={venuePayAmount}
          onChangeText={setVenuePayAmount}
          placeholder="600"
          placeholderTextColor={colors.text.disabled}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.primaryButton}>
          <Icon name="cash-check" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Sahaya Öde</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLedger = () => (
    <View>
      <Text style={styles.sectionLabel}>HESAP DEFTERİ</Text>
      {MOCK_LEDGER.map((entry) => (
        <View key={entry.id} style={styles.ledgerRow}>
          <View style={[styles.ledgerIcon, { backgroundColor: entry.type === 'in' ? `${colors.success}20` : `${colors.error}20` }]}>
            <Icon
              name={entry.type === 'in' ? 'arrow-down' : 'arrow-up'}
              size={18}
              color={entry.type === 'in' ? colors.success : colors.error}
            />
          </View>
          <View style={styles.ledgerInfo}>
            <Text style={styles.ledgerDesc}>{entry.desc}</Text>
            <Text style={styles.ledgerDate}>{entry.date}</Text>
          </View>
          <Text style={[styles.ledgerAmount, { color: entry.type === 'in' ? colors.success : colors.error }]}>
            {entry.type === 'in' ? '+' : ''}₺{Math.abs(entry.amount)}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderSummary = () => (
    <View>
      <Text style={styles.sectionLabel}>TAHSİLAT ÖZETİ</Text>

      {/* Progress Card */}
      <View style={styles.summaryProgressCard}>
        <View style={styles.summaryProgressHeader}>
          <Text style={styles.summaryProgressLabel}>Tahsilat Oranı</Text>
          <Text style={styles.summaryProgressValue}>%{collectionPct}</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${collectionPct}%` as any }]} />
        </View>
        <Text style={styles.progressSub}>
          {MOCK_MEMBERS.filter((m) => m.paid).length}/{MOCK_MEMBERS.length} üye ödedi
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Icon name="cash-plus" size={24} color={colors.success} />
          <Text style={styles.statValue}>₺{totalPaid}</Text>
          <Text style={styles.statLabel}>Toplanan</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="cash-clock" size={24} color={colors.warning} />
          <Text style={styles.statValue}>₺{totalExpected - totalPaid}</Text>
          <Text style={styles.statLabel}>Bekleyen</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="cash-multiple" size={24} color={colors.primary} />
          <Text style={styles.statValue}>₺{totalExpected}</Text>
          <Text style={styles.statLabel}>Toplam</Text>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'contributions': return renderContributions();
      case 'outbox': return renderOutbox();
      case 'payVenue': return renderPayVenue();
      case 'ledger': return renderLedger();
      case 'summary': return renderSummary();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ödeme Merkezi</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Reservation Info */}
      <View style={styles.reservationInfo}>
        <View style={styles.reservationRow}>
          <Icon name="stadium-variant" size={18} color={colors.primary} />
          <Text style={styles.reservationVenue}>Yıldız Halısaha</Text>
        </View>
        <View style={styles.reservationRow}>
          <Icon name="calendar" size={14} color={colors.text.tertiary} />
          <Text style={styles.reservationDate}>05 Mart 2025 · 20:00 - 21:00</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Icon
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? colors.primary : colors.text.tertiary}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <AppScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={true}
      >
        {renderTabContent()}
      </AppScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
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
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  // Reservation info
  reservationInfo: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  reservationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  reservationVenue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  reservationDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  // Tab bar
  tabBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    maxHeight: 48,
  },
  tabBarContent: {
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  // Scroll content
  scrollContent: { flex: 1 },
  scrollInner: { padding: spacing.lg, paddingBottom: 100 },
  // Section label
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  // Member cards (Contributions)
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  memberInfo: { flex: 1 },
  memberName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  memberStatus: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  memberRight: {
    alignItems: 'flex-end',
  },
  memberAmount: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  // Empty card
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptySubText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  // Primary button
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
  // Pay Venue
  venuePayCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  venuePayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venuePayTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  venuePaySub: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  // Ledger
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  ledgerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  ledgerInfo: { flex: 1 },
  ledgerDesc: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  ledgerDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  ledgerAmount: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  // Summary
  summaryProgressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  summaryProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryProgressLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  summaryProgressValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBg: {
    height: 10,
    backgroundColor: colors.border.light,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  progressSub: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});
