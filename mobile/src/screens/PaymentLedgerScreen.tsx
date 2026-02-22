/**
 * Payment Ledger Screen – Ödeme geçmişi (Firestore)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getPayments, addPayment } from '../services/finance';
import { getTeamIdForUser, getPlayers } from '../services/players';
import { canAccessAdminPanel } from '../utils/permissions';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import type { Payment } from '../types';

type NavProp = StackNavigationProp<RootStackParamList, 'PaymentLedger'>;
type RouteProp = RouteProp<RootStackParamList, 'PaymentLedger'>;

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Ödendi',
  PENDING: 'Bekliyor',
  REFUND: 'İade',
};

const STATUS_COLORS: Record<string, string> = {
  PAID: colors.success,
  PENDING: colors.warning,
  REFUND: colors.text.tertiary,
};

export default function PaymentLedgerScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<RouteProp>();
  const { user } = useAuth();
  const myPaymentsOnly = params?.myPaymentsOnly ?? false;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [players, setPlayers] = useState<Awaited<ReturnType<typeof getPlayers>>>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addStatus, setAddStatus] = useState<'PAID' | 'PENDING'>('PENDING');
  const [addMonth, setAddMonth] = useState(new Date().toISOString().slice(0, 7));
  const [addSubmitting, setAddSubmitting] = useState(false);
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
      await addPayment({
        playerId: selectedPlayerId,
        playerName: player?.name,
        teamId,
        amount,
        status: addStatus,
        month: addMonth,
      });
      setShowAddForm(false);
      setAddAmount('');
      await fetchData();
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Eklenemedi');
    } finally {
      setAddSubmitting(false);
    }
  };

  const paidTotal = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const pendingTotal = payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);

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
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>Ödeme Ekle</Text>
            <Text style={styles.addLabel}>Üye</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerChips}>
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
            <Text style={styles.addLabel}>Tutar</Text>
            <TextInput
              style={styles.addInput}
              value={addAmount}
              onChangeText={setAddAmount}
              placeholder="150"
              placeholderTextColor={colors.text.disabled}
              keyboardType="numeric"
            />
            <View style={styles.addFormRow}>
              <TouchableOpacity
                style={[styles.addStatusBtn, addStatus === 'PAID' && styles.addStatusActive]}
                onPress={() => setAddStatus('PAID')}
              >
                <Text style={addStatus === 'PAID' ? styles.addStatusTextActive : styles.addStatusText}>Ödendi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addStatusBtn, addStatus === 'PENDING' && styles.addStatusActive]}
                onPress={() => setAddStatus('PENDING')}
              >
                <Text style={addStatus === 'PENDING' ? styles.addStatusTextActive : styles.addStatusText}>Bekliyor</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.addLabel}>Ay (YYYY-MM)</Text>
            <TextInput
              style={styles.addInput}
              value={addMonth}
              onChangeText={setAddMonth}
              placeholder="2025-02"
              placeholderTextColor={colors.text.disabled}
            />
            <TouchableOpacity
              style={[styles.addSubmitBtn, addSubmitting && styles.addSubmitDisabled]}
              onPress={handleAddPayment}
              disabled={addSubmitting}
            >
              {addSubmitting ? <ActivityIndicator color={colors.secondary} size="small" /> : <Text style={styles.addSubmitText}>Ekle</Text>}
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Icon name="check-circle" size={24} color={colors.success} />
            <Text style={styles.summaryLabel}>Toplam Ödenen</Text>
            <Text style={styles.summaryValue}>₺{paidTotal.toLocaleString('tr-TR')}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Icon name="clock-outline" size={24} color={colors.warning} />
            <Text style={styles.summaryLabel}>Bekleyen</Text>
            <Text style={styles.summaryValue}>₺{pendingTotal.toLocaleString('tr-TR')}</Text>
          </View>
        </View>

        {payments.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="receipt-text" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Ödeme kaydı bulunamadı</Text>
          </View>
        ) : (
          payments.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: `${STATUS_COLORS[p.status] || colors.primary}30` }]}>
                <Icon
                  name={p.status === 'PAID' ? 'check-circle' : p.status === 'REFUND' ? 'undo' : 'clock-outline'}
                  size={22}
                  color={STATUS_COLORS[p.status] || colors.primary}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{p.playerName || 'Üye'}</Text>
                <Text style={styles.cardMonth}>{p.month || p.dueDate || '-'}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardAmount}>₺{p.amount.toLocaleString('tr-TR')}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[p.status] || colors.primary}30` }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[p.status] || colors.primary }]}>
                    {STATUS_LABELS[p.status] || p.status}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.text.secondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  placeholder: { width: 40 },
  content: { flex: 1 },
  contentInner: { padding: spacing.lg, paddingBottom: 100 },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  summaryCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  summaryLabel: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: spacing.xs },
  summaryValue: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { marginTop: spacing.md, color: colors.text.secondary },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: { flex: 1 },
  cardName: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text.primary },
  cardMonth: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardAmount: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, marginTop: 4 },
  statusText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  addBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  addForm: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  addFormTitle: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.md },
  addLabel: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: spacing.xs },
  playerChips: { marginBottom: spacing.md },
  playerChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, backgroundColor: colors.background.secondary, marginRight: spacing.sm },
  playerChipSelected: { backgroundColor: `${colors.primary}30`, borderWidth: 1, borderColor: colors.primary },
  playerChipText: { color: colors.text.secondary, fontSize: typography.fontSize.sm },
  playerChipTextSelected: { color: colors.primary, fontWeight: '600', fontSize: typography.fontSize.sm },
  addInput: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  addFormRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  addStatusBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.background.secondary, alignItems: 'center' },
  addStatusActive: { backgroundColor: `${colors.primary}30`, borderWidth: 1, borderColor: colors.primary },
  addStatusText: { color: colors.text.secondary, fontWeight: '600' },
  addStatusTextActive: { color: colors.primary, fontWeight: '600' },
  addSubmitBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  addSubmitDisabled: { opacity: 0.7 },
  addSubmitText: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.secondary },
});
