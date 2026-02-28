/**
 * Payment Ledger Screen – Ödeme defteri + EFT/Banka havalesi
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Linking,
  Clipboard,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp as RNRouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getPayments, addPayment, uploadAndSetPaymentProof } from '../services/finance';
import { getTeamIdForUser, getPlayers } from '../services/players';
import { canAccessAdminPanel } from '../utils/permissions';
import AppScrollView from '../components/AppScrollView';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import type { Payment } from '../types';

type NavProp = StackNavigationProp<RootStackParamList, 'PaymentLedger'>;
type RouteP = RNRouteProp<RootStackParamList, 'PaymentLedger'>;

const STATUS_LABELS: Record<string, string> = { PAID: 'Ödendi', PENDING: 'Bekliyor', REFUND: 'İade' };
const STATUS_COLORS: Record<string, string> = {
  PAID: colors.success,
  PENDING: colors.warning,
  REFUND: colors.text.tertiary,
};

// ─────────────────────────────────────────
// Banka bilgileri (örnek)
// ─────────────────────────────────────────
const BANK_ACCOUNTS = [
  {
    bank: 'Ziraat Bankası',
    logo: 'bank',
    logoColor: '#CC0000',
    account: 'Sahada Spor Kulübü',
    iban: 'TR12 0001 2345 6789 0123 4567 89',
    branch: 'İstanbul / Merkez',
  },
  {
    bank: 'Garanti BBVA',
    logo: 'bank-outline',
    logoColor: '#009640',
    account: 'Sahada Spor Kulübü',
    iban: 'TR98 0006 2000 1111 0000 0000 00',
    branch: 'İstanbul / Şişli',
  },
];

function BankCard({ acc }: { acc: typeof BANK_ACCOUNTS[0] }) {
  const copyIban = () => {
    Clipboard.setString(acc.iban);
    Alert.alert('Kopyalandı', 'IBAN panoya kopyalandı.');
  };
  return (
    <View style={bankStyles.card}>
      <View style={bankStyles.header}>
        <View style={[bankStyles.icon, { backgroundColor: `${acc.logoColor}18` }]}>
          <Icon name={acc.logo as any} size={22} color={acc.logoColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={bankStyles.bankName}>{acc.bank}</Text>
          <Text style={bankStyles.branch}>{acc.branch}</Text>
        </View>
      </View>
      <View style={bankStyles.row}>
        <Text style={bankStyles.label}>Hesap Adı</Text>
        <Text style={bankStyles.value}>{acc.account}</Text>
      </View>
      <View style={bankStyles.row}>
        <Text style={bankStyles.label}>IBAN</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={bankStyles.iban}>{acc.iban}</Text>
          <TouchableOpacity onPress={copyIban} style={bankStyles.copyBtn}>
            <Icon name="content-copy" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const bankStyles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border.light },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  icon: { width: 44, height: 44, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  bankName: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary },
  branch: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border.light },
  label: { fontSize: typography.fontSize.xs, color: colors.text.secondary, fontWeight: '600' },
  value: { fontSize: typography.fontSize.sm, color: colors.text.primary, fontWeight: '600' },
  iban: { fontSize: typography.fontSize.xs, color: colors.primary, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  copyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: `${colors.primary}18`, justifyContent: 'center', alignItems: 'center' },
});

// ─────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────
export default function PaymentLedgerScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<RouteP>();
  const { user } = useAuth();
  const myPaymentsOnly = params?.myPaymentsOnly ?? false;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'payments' | 'eft'>('payments');
  const [showAddForm, setShowAddForm] = useState(false);
  const [players, setPlayers] = useState<Awaited<ReturnType<typeof getPlayers>>>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addStatus, setAddStatus] = useState<'PAID' | 'PENDING'>('PENDING');
  const [addMonth, setAddMonth] = useState(new Date().toISOString().slice(0, 7));
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const canAdd = canAccessAdminPanel(user);

  const fetchData = useCallback(async () => {
    const teamId = user?.id ? await getTeamIdForUser(user.id) : undefined;
    const list = await getPayments(
      myPaymentsOnly && user?.id
        ? { playerId: user.id }
        : teamId
          ? { teamId }
          : undefined
    );
    setPayments(list);
    if (canAdd && teamId) {
      const pList = await getPlayers({ teamId });
      setPlayers(pList);
      if (pList.length > 0) setSelectedPlayerId((prev) => (prev && pList.some((p) => p.id === prev)) ? prev : pList[0].id);
    }
  }, [user?.id, myPaymentsOnly, canAdd]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchData().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleAddPayment = async () => {
    const amount = parseInt(addAmount, 10);
    if (!amount || amount <= 0 || !selectedPlayerId) {
      Alert.alert('Hata', 'Üye seçin ve geçerli tutar girin.');
      return;
    }
    const teamId = user?.id ? await getTeamIdForUser(user.id) : undefined;
    const player = players.find((p) => p.id === selectedPlayerId);
    setAddSubmitting(true);
    try {
      await addPayment({ playerId: selectedPlayerId, playerName: player?.name, teamId, amount, status: addStatus, month: addMonth });
      setShowAddForm(false);
      setAddAmount('');
      await fetchData();
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Eklenemedi');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleUploadProof = useCallback(async (payment: Payment) => {
    if (payment.playerId !== user?.id) return;
    const { launchImageLibrary } = require('react-native-image-picker');
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1200 });
    if (result.didCancel || result.errorCode || !result.assets?.[0]?.uri) return;
    const uri = result.assets[0].uri;
    setUploadingId(payment.id);
    try {
      await uploadAndSetPaymentProof(payment.id, uri);
      await fetchData();
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Dekont yüklenemedi');
    } finally {
      setUploadingId(null);
    }
  }, [user?.id, fetchData]);

  const paidTotal = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const pendingTotal = payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);
  const collectionRate = payments.length > 0
    ? Math.round((payments.filter((p) => p.status === 'PAID').length / payments.length) * 100)
    : 0;

  if (loading && payments.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{myPaymentsOnly ? 'Ödemelerim' : 'Ödeme Defteri'}</Text>
        {canAdd && !myPaymentsOnly ? (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(!showAddForm)}>
            <Icon name={showAddForm ? 'close' : 'plus'} size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'payments' && styles.tabActive]} onPress={() => setActiveTab('payments')}>
          <Icon name="receipt-text" size={16} color={activeTab === 'payments' ? colors.primary : colors.text.secondary} />
          <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>Ödemeler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'eft' && styles.tabActive]} onPress={() => setActiveTab('eft')}>
          <Icon name="bank-transfer" size={16} color={activeTab === 'eft' ? colors.primary : colors.text.secondary} />
          <Text style={[styles.tabText, activeTab === 'eft' && styles.tabTextActive]}>EFT / Havale</Text>
        </TouchableOpacity>
      </View>

      <AppScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        nestedScrollEnabled={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'payments' ? (
          <>
            {/* Summary */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Icon name="check-circle" size={22} color={colors.success} />
                <Text style={styles.summaryLabel}>Ödenen</Text>
                <Text style={styles.summaryValue}>₺{paidTotal.toLocaleString('tr-TR')}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Icon name="clock-outline" size={22} color={colors.warning} />
                <Text style={styles.summaryLabel}>Bekleyen</Text>
                <Text style={styles.summaryValue}>₺{pendingTotal.toLocaleString('tr-TR')}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Icon name="percent" size={22} color={colors.primary} />
                <Text style={styles.summaryLabel}>Tahsilat</Text>
                <Text style={styles.summaryValue}>%{collectionRate}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Tahsilat Oranı</Text>
                <Text style={styles.progressValue}>%{collectionRate}</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${collectionRate}%` as any }]} />
              </View>
              <Text style={styles.progressSub}>{payments.filter(p => p.status === 'PAID').length}/{payments.length} ödeme tamamlandı</Text>
            </View>

            {/* Add Form */}
            {showAddForm && (
              <View style={styles.addForm}>
                <Text style={styles.addFormTitle}>Yeni Ödeme Ekle</Text>
                <Text style={styles.addLabel}>Üye</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                  {players.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.playerChip, selectedPlayerId === p.id && styles.playerChipSelected]}
                      onPress={() => setSelectedPlayerId(p.id)}
                    >
                      <Text style={selectedPlayerId === p.id ? styles.playerChipTextSelected : styles.playerChipText}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.addLabel}>Tutar (₺)</Text>
                <TextInput style={styles.addInput} value={addAmount} onChangeText={setAddAmount} placeholder="150" placeholderTextColor={colors.text.disabled} keyboardType="numeric" />
                <View style={styles.addFormRow}>
                  <TouchableOpacity style={[styles.addStatusBtn, addStatus === 'PAID' && styles.addStatusActive]} onPress={() => setAddStatus('PAID')}>
                    <Text style={addStatus === 'PAID' ? styles.addStatusTextActive : styles.addStatusText}>✓ Ödendi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.addStatusBtn, addStatus === 'PENDING' && styles.addStatusActive]} onPress={() => setAddStatus('PENDING')}>
                    <Text style={addStatus === 'PENDING' ? styles.addStatusTextActive : styles.addStatusText}>⏳ Bekliyor</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.addLabel}>Ay (YYYY-MM)</Text>
                <TextInput style={styles.addInput} value={addMonth} onChangeText={setAddMonth} placeholder="2025-02" placeholderTextColor={colors.text.disabled} />
                <TouchableOpacity style={[styles.addSubmitBtn, addSubmitting && styles.addSubmitDisabled]} onPress={handleAddPayment} disabled={addSubmitting}>
                  {addSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addSubmitText}>Ekle</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* Payments List */}
            {payments.length === 0 ? (
              <View style={styles.empty}>
                <Icon name="receipt-text" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>Ödeme kaydı bulunamadı</Text>
              </View>
            ) : (
              payments.map((p) => (
                <View key={p.id} style={styles.card}>
                  <View style={[styles.cardIcon, { backgroundColor: `${STATUS_COLORS[p.status] || colors.primary}20` }]}>
                    <Icon name={p.status === 'PAID' ? 'check-circle' : p.status === 'REFUND' ? 'undo' : 'clock-outline'} size={22} color={STATUS_COLORS[p.status] || colors.primary} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardName}>{p.playerName || 'Üye'}</Text>
                    <Text style={styles.cardMonth}>{p.month || p.dueDate || '-'}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.cardAmount}>₺{p.amount.toLocaleString('tr-TR')}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[p.status] || colors.primary}20` }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[p.status] || colors.primary }]}>{STATUS_LABELS[p.status] || p.status}</Text>
                    </View>
                    {(p.proofUrl || (p.status === 'PENDING' && p.playerId === user?.id)) && (
                      <View style={{ marginTop: 4 }}>
                        {p.proofUrl ? (
                          <TouchableOpacity style={styles.proofBtn} onPress={() => Linking.openURL(p.proofUrl!)}>
                            <Icon name="file-image" size={12} color={colors.primary} />
                            <Text style={styles.proofBtnText}>Dekont Görüntüle</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity style={[styles.proofBtn, uploadingId === p.id && styles.proofBtnDisabled]} onPress={() => handleUploadProof(p)} disabled={!!uploadingId}>
                            {uploadingId === p.id ? <ActivityIndicator size="small" color={colors.primary} /> : (
                              <>
                                <Icon name="camera-plus" size={12} color={colors.primary} />
                                <Text style={styles.proofBtnText}>Dekont Yükle</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {/* EFT Tab */}
            <View style={styles.eftHero}>
              <Icon name="bank-transfer" size={32} color={colors.primary} />
              <Text style={styles.eftHeroTitle}>EFT / Banka Havalesi</Text>
              <Text style={styles.eftHeroDesc}>
                Aşağıdaki banka hesaplarından birine havale yaparak aidatınızı ödeyebilirsiniz. Ödeme sonrası dekontunuzu uygulamadan yükleyin.
              </Text>
            </View>

            {/* Bank Accounts */}
            <Text style={styles.sectionLabel}>BANKA HESAPLARI</Text>
            {BANK_ACCOUNTS.map((acc) => (
              <BankCard key={acc.iban} acc={acc} />
            ))}

            {/* Instructions */}
            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>📋 Ödeme Adımları</Text>
              {[
                'Yukarıdaki banka hesaplarından birini seçin',
                'Açıklama kısmına adınızı ve ödeme ayını yazın (örn: "Ahmet Yılmaz – Ocak 2025 Aidat")',
                'Havaleyi gerçekleştirin',
                '"Ödemeler" sekmesinden dekontunuzu yükleyin',
                'Yönetici onayladıktan sonra ödemeniz tamamlanmış sayılır',
              ].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            {/* Contact */}
            <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:muhasebe@sahada.app')}>
              <Icon name="email-outline" size={20} color={colors.primary} />
              <Text style={styles.contactText}>Muhasebe Birimine Yaz</Text>
            </TouchableOpacity>
          </>
        )}
      </AppScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.text.secondary },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border.light,
  },
  backBtn: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: typography.fontSize.xl, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  addBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  tabRow: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border.light },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.md },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text.secondary },
  tabTextActive: { color: colors.primary },
  content: { flex: 1 },
  contentInner: { padding: spacing.lg, paddingBottom: 100 },
  // Summary
  summaryGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border.light },
  summaryLabel: { fontSize: 10, color: colors.text.secondary, marginTop: 4, textAlign: 'center' },
  summaryValue: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary, marginTop: 2 },
  // Progress
  progressCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border.light },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text.secondary },
  progressValue: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.primary },
  progressBg: { height: 8, backgroundColor: colors.border.light, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  progressSub: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: 6 },
  // Add form
  addForm: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border.light },
  addFormTitle: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.md },
  addLabel: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.text.secondary, marginBottom: 6 },
  playerChip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.lg, backgroundColor: colors.background.secondary, marginRight: spacing.sm },
  playerChipSelected: { backgroundColor: `${colors.primary}20`, borderWidth: 1, borderColor: colors.primary },
  playerChipText: { color: colors.text.secondary, fontSize: typography.fontSize.sm },
  playerChipTextSelected: { color: colors.primary, fontWeight: '600', fontSize: typography.fontSize.sm },
  addInput: { backgroundColor: colors.background.primary, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.fontSize.md, color: colors.text.primary, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border.light },
  addFormRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  addStatusBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.background.secondary, alignItems: 'center' },
  addStatusActive: { backgroundColor: `${colors.primary}20`, borderWidth: 1, borderColor: colors.primary },
  addStatusText: { color: colors.text.secondary, fontWeight: '600', fontSize: typography.fontSize.sm },
  addStatusTextActive: { color: colors.primary, fontWeight: '600', fontSize: typography.fontSize.sm },
  addSubmitBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  addSubmitDisabled: { opacity: 0.7 },
  addSubmitText: { fontSize: typography.fontSize.md, fontWeight: '700', color: '#fff' },
  // List
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { marginTop: spacing.md, color: colors.text.secondary },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border.light },
  cardIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  cardContent: { flex: 1 },
  cardName: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text.primary },
  cardMonth: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardAmount: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, marginTop: 4 },
  statusText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  proofBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  proofBtnDisabled: { opacity: 0.6 },
  proofBtnText: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  // EFT Tab
  eftHero: { alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.md },
  eftHeroTitle: { fontSize: typography.fontSize.xl, fontWeight: '700', color: colors.text.primary, marginTop: spacing.md },
  eftHeroDesc: { fontSize: typography.fontSize.sm, color: colors.text.secondary, textAlign: 'center', lineHeight: 20, marginTop: spacing.sm },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.text.tertiary, letterSpacing: 1.5, marginBottom: spacing.md },
  instructionCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border.light },
  instructionTitle: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: `${colors.primary}20`, justifyContent: 'center', alignItems: 'center' },
  stepNumText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  stepText: { flex: 1, fontSize: typography.fontSize.sm, color: colors.text.secondary, lineHeight: 20 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.primary },
  contactText: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.primary },
});
