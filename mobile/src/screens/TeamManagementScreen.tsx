/**
 * TeamManagementScreen – Kaptan takım yönetimi
 * Sekmeler: Teams, Invites, IBAN, Requests
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AppScrollView from '../components/AppScrollView';
import { colors, spacing, borderRadius, typography } from '../theme';

type TabKey = 'teams' | 'invites' | 'iban' | 'requests';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'teams', label: 'Takımlar', icon: 'account-group' },
  { key: 'invites', label: 'Davetler', icon: 'email-send' },
  { key: 'iban', label: 'IBAN', icon: 'bank' },
  { key: 'requests', label: 'İstekler', icon: 'account-clock' },
];

interface Team {
  id: string;
  name: string;
  memberCount: number;
  color: string;
}

interface Invite {
  id: string;
  code: string;
  teamName: string;
  usedCount: number;
  maxUses: number;
  active: boolean;
}

interface JoinRequest {
  id: string;
  playerName: string;
  teamName: string;
  position: string;
  date: string;
}

const MOCK_TEAMS: Team[] = [
  { id: '1', name: 'Kartal FC', memberCount: 14, color: '#3B82F6' },
  { id: '2', name: 'Yıldız Spor', memberCount: 11, color: '#10B981' },
];

const MOCK_INVITES: Invite[] = [
  { id: '1', code: 'KARTAL-2025-AX7', teamName: 'Kartal FC', usedCount: 5, maxUses: 20, active: true },
  { id: '2', code: 'YILDIZ-2025-QM3', teamName: 'Yıldız Spor', usedCount: 11, maxUses: 15, active: true },
  { id: '3', code: 'KARTAL-2024-OLD', teamName: 'Kartal FC', usedCount: 12, maxUses: 12, active: false },
];

const MOCK_REQUESTS: JoinRequest[] = [
  { id: '1', playerName: 'Oğuz Akman', teamName: 'Kartal FC', position: 'MID', date: '2025-03-04' },
  { id: '2', playerName: 'Tolga Baran', teamName: 'Yıldız Spor', position: 'FWD', date: '2025-03-03' },
  { id: '3', playerName: 'Deniz Kurt', teamName: 'Kartal FC', position: 'DEF', date: '2025-03-02' },
];

export default function TeamManagementScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('teams');
  const [ibanHolder, setIbanHolder] = useState('');
  const [ibanValue, setIbanValue] = useState('');
  const [bankName, setBankName] = useState('');
  const [savingIban, setSavingIban] = useState(false);

  const handleCopyCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Kopyalandı', `${code} panoya kopyalandı.`);
  };

  const handleRevokeInvite = (invite: Invite) => {
    Alert.alert('Daveti İptal Et', `"${invite.code}" iptal edilsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'İptal Et', style: 'destructive', onPress: () => {} },
    ]);
  };

  const handleApprove = (req: JoinRequest) => {
    Alert.alert('Onayla', `${req.playerName} takıma eklensin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Onayla', onPress: () => {} },
    ]);
  };

  const handleReject = (req: JoinRequest) => {
    Alert.alert('Reddet', `${req.playerName} reddedilsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Reddet', style: 'destructive', onPress: () => {} },
    ]);
  };

  const handleSaveIban = async () => {
    if (!ibanHolder.trim() || !ibanValue.trim()) {
      Alert.alert('Hata', 'IBAN ve hesap sahibi alanlarını doldurun.');
      return;
    }
    setSavingIban(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSavingIban(false);
    Alert.alert('Kaydedildi', 'IBAN bilgileri güncellendi.');
  };

  const renderTeams = () => (
    <View>
      <Text style={styles.sectionLabel}>TAKIMLARIM</Text>
      {MOCK_TEAMS.map((team) => (
        <TouchableOpacity key={team.id} style={styles.teamCard} activeOpacity={0.7}>
          <View style={[styles.teamIcon, { backgroundColor: `${team.color}20` }]}>
            <Icon name="shield-half-full" size={24} color={team.color} />
          </View>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamMeta}>{team.memberCount} üye</Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
      ))}

      {/* Create new team */}
      <TouchableOpacity style={styles.createTeamBtn}>
        <View style={styles.createTeamIcon}>
          <Icon name="plus" size={24} color={colors.primary} />
        </View>
        <Text style={styles.createTeamText}>Yeni Takım Oluştur</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInvites = () => (
    <View>
      <Text style={styles.sectionLabel}>DAVET KODLARI</Text>
      {MOCK_INVITES.map((invite) => (
        <View key={invite.id} style={styles.inviteCard}>
          <View style={styles.inviteHeader}>
            <View style={[styles.inviteStatus, { backgroundColor: invite.active ? `${colors.success}20` : `${colors.error}20` }]}>
              <View style={[styles.inviteStatusDot, { backgroundColor: invite.active ? colors.success : colors.error }]} />
              <Text style={[styles.inviteStatusText, { color: invite.active ? colors.success : colors.error }]}>
                {invite.active ? 'Aktif' : 'Pasif'}
              </Text>
            </View>
            <Text style={styles.inviteTeam}>{invite.teamName}</Text>
          </View>

          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{invite.code}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopyCode(invite.code)}>
              <Icon name="content-copy" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inviteProgress}>
            <View style={styles.inviteProgressBg}>
              <View
                style={[
                  styles.inviteProgressFill,
                  { width: `${(invite.usedCount / invite.maxUses) * 100}%` as any },
                ]}
              />
            </View>
            <Text style={styles.inviteUsage}>
              {invite.usedCount}/{invite.maxUses} kullanıldı
            </Text>
          </View>

          {invite.active && (
            <TouchableOpacity style={styles.revokeBtn} onPress={() => handleRevokeInvite(invite)}>
              <Icon name="close-circle-outline" size={16} color={colors.error} />
              <Text style={styles.revokeBtnText}>İptal Et</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.primaryButton}>
        <Icon name="plus-circle" size={18} color="#fff" />
        <Text style={styles.primaryButtonText}>Yeni Davet Kodu</Text>
      </TouchableOpacity>
    </View>
  );

  const renderIban = () => (
    <View>
      <Text style={styles.sectionLabel}>ÖDEME PROFİLİ</Text>
      <View style={styles.ibanCard}>
        <View style={styles.ibanHeader}>
          <Icon name="bank" size={24} color={colors.primary} />
          <Text style={styles.ibanTitle}>IBAN Bilgileri</Text>
        </View>
        <Text style={styles.ibanDesc}>
          Üye ödemelerinin aktarılacağı banka hesap bilgilerinizi girin.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.inputLabel}>Hesap Sahibi *</Text>
        <TextInput
          style={styles.input}
          value={ibanHolder}
          onChangeText={setIbanHolder}
          placeholder="Ad Soyad"
          placeholderTextColor={colors.text.disabled}
        />

        <Text style={styles.inputLabel}>Banka</Text>
        <TextInput
          style={styles.input}
          value={bankName}
          onChangeText={setBankName}
          placeholder="Banka adı"
          placeholderTextColor={colors.text.disabled}
        />

        <Text style={styles.inputLabel}>IBAN *</Text>
        <TextInput
          style={styles.input}
          value={ibanValue}
          onChangeText={setIbanValue}
          placeholder="TR00 0000 0000 0000 0000 0000 00"
          placeholderTextColor={colors.text.disabled}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={[styles.primaryButton, savingIban && styles.primaryButtonDisabled]}
          onPress={handleSaveIban}
          disabled={savingIban}
        >
          {savingIban ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="content-save" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Kaydet</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequests = () => (
    <View>
      <Text style={styles.sectionLabel}>KATILIM İSTEKLERİ</Text>
      {MOCK_REQUESTS.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="account-check" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>Bekleyen istek yok</Text>
        </View>
      ) : (
        MOCK_REQUESTS.map((req) => (
          <View key={req.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.requestAvatar}>
                <Icon name="account" size={24} color={colors.primary} />
              </View>
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{req.playerName}</Text>
                <Text style={styles.requestMeta}>
                  {req.teamName} · {req.position} · {req.date}
                </Text>
              </View>
            </View>
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={[styles.requestBtn, styles.approveBtn]}
                onPress={() => handleApprove(req)}
              >
                <Icon name="check" size={18} color="#fff" />
                <Text style={styles.requestBtnText}>Onayla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.requestBtn, styles.rejectBtn]}
                onPress={() => handleReject(req)}
              >
                <Icon name="close" size={18} color={colors.error} />
                <Text style={[styles.requestBtnText, { color: colors.error }]}>Reddet</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'teams': return renderTeams();
      case 'invites': return renderInvites();
      case 'iban': return renderIban();
      case 'requests': return renderRequests();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Takım Yönetimi</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabRow}>
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
            {tab.key === 'requests' && MOCK_REQUESTS.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{MOCK_REQUESTS.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

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
  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  // Scroll
  scrollContent: { flex: 1 },
  scrollInner: { padding: spacing.lg, paddingBottom: 100 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  // Teams
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  teamInfo: { flex: 1 },
  teamName: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.text.primary,
  },
  teamMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  createTeamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  createTeamIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  createTeamText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  // Invites
  inviteCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  inviteStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  inviteStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inviteStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  inviteTeam: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  codeText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}18`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteProgress: {
    marginBottom: spacing.sm,
  },
  inviteProgressBg: {
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  inviteProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  inviteUsage: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  revokeBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.error,
  },
  // IBAN
  ibanCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  ibanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ibanTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  ibanDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
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
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
  // Requests
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  requestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  requestInfo: { flex: 1 },
  requestName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  requestMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  requestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  approveBtn: {
    backgroundColor: colors.primary,
  },
  rejectBtn: {
    backgroundColor: `${colors.error}15`,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  requestBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: '#fff',
  },
  // Empty
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});
