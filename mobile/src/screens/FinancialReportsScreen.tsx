/**
 * Financial Reports Screen – Gelir/Gider raporları (Firestore)
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions, addTransaction } from '../services/finance';
import { getTeamIdForUser } from '../services/players';
import { canAccessAdminPanel } from '../utils/permissions';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import type { Transaction } from '../types';

type NavProp = StackNavigationProp<RootStackParamList, 'FinancialReports'>;

const CATEGORY_LABELS: Record<string, string> = {
  gelir: 'Gelir',
  aidat: 'Aidat',
  saha_kirasi: 'Saha Kirası',
  ekipman: 'Ekipman',
  diger: 'Diğer',
};

export default function FinancialReportsScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'income' | 'expense'>('income');
  const [addAmount, setAddAmount] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addDate, setAddDate] = useState(new Date().toISOString().slice(0, 10));
  const [addSubmitting, setAddSubmitting] = useState(false);
  const canAdd = canAccessAdminPanel(user);

  const fetchData = useCallback(async () => {
    const teamId = user?.id ? await getTeamIdForUser(user.id) : undefined;
    const list = await getTransactions(teamId ? { teamId } : undefined);
    setTransactions(list);
  }, [user?.id]);

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

  const filtered = filter === 'all'
    ? transactions
    : filter === 'income'
      ? transactions.filter((t) => t.type === 'income')
      : transactions.filter((t) => t.type === 'expense');

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const handleAddTransaction = async () => {
    const amount = parseInt(addAmount, 10);
    if (!amount || amount <= 0) {
      Alert.alert('Hata', 'Geçerli tutar girin.');
      return;
    }
    const teamId = user?.id ? await getTeamIdForUser(user.id) : undefined;
    setAddSubmitting(true);
    try {
      await addTransaction({
        teamId,
        type: addType,
        amount,
        date: addDate || new Date().toISOString().slice(0, 10),
        description: addDesc.trim() || (addType === 'income' ? 'Gelir' : 'Gider'),
      });
      setShowAddForm(false);
      setAddAmount('');
      setAddDesc('');
      await fetchData();
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Eklenemedi');
    } finally {
      setAddSubmitting(false);
    }
  };

  if (loading && transactions.length === 0) {
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
        <Text style={styles.headerTitle}>Finansal Rapor</Text>
        {canAdd ? (
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
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Icon name="trending-up" size={24} color={colors.success} />
            <Text style={styles.summaryLabel}>Gelir</Text>
            <Text style={styles.summaryValue}>₺{totalIncome.toLocaleString('tr-TR')}</Text>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Icon name="trending-down" size={24} color={colors.error} />
            <Text style={styles.summaryLabel}>Gider</Text>
            <Text style={styles.summaryValue}>₺{totalExpense.toLocaleString('tr-TR')}</Text>
          </View>
        </View>
        <View style={[styles.summaryCard, styles.balanceCard]}>
          <Text style={styles.balanceLabel}>Bakiye</Text>
          <Text style={[styles.balanceValue, { color: balance >= 0 ? colors.success : colors.error }]}>
            ₺{balance.toLocaleString('tr-TR')}
          </Text>
        </View>

        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>İşlem Ekle</Text>
            <View style={styles.addFormRow}>
              <TouchableOpacity
                style={[styles.addTypeBtn, addType === 'income' && styles.addTypeActive]}
                onPress={() => setAddType('income')}
              >
                <Text style={addType === 'income' ? styles.addTypeTextActive : styles.addTypeText}>Gelir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addTypeBtn, addType === 'expense' && styles.addTypeActive]}
                onPress={() => setAddType('expense')}
              >
                <Text style={addType === 'expense' ? styles.addTypeTextActive : styles.addTypeText}>Gider</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.addInput}
              value={addAmount}
              onChangeText={setAddAmount}
              placeholder="Tutar"
              placeholderTextColor={colors.text.disabled}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.addInput}
              value={addDesc}
              onChangeText={setAddDesc}
              placeholder="Açıklama"
              placeholderTextColor={colors.text.disabled}
            />
            <TextInput
              style={styles.addInput}
              value={addDate}
              onChangeText={setAddDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.disabled}
            />
            <TouchableOpacity
              style={[styles.addSubmitBtn, addSubmitting && styles.addSubmitDisabled]}
              onPress={handleAddTransaction}
              disabled={addSubmitting}
            >
              {addSubmitting ? <ActivityIndicator color={colors.secondary} size="small" /> : <Text style={styles.addSubmitText}>Ekle</Text>}
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.filterRow}>
          {(['all', 'income', 'expense'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'Tümü' : f === 'income' ? 'Gelir' : 'Gider'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="chart-bar" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>İşlem bulunamadı</Text>
          </View>
        ) : (
          filtered.map((t) => (
            <View key={t.id} style={styles.card}>
              <View style={[styles.cardIcon, t.type === 'income' ? styles.iconIncome : styles.iconExpense]}>
                <Icon
                  name={t.type === 'income' ? 'cash-plus' : 'cash-minus'}
                  size={20}
                  color={t.type === 'income' ? colors.success : colors.error}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardDesc}>{t.description || CATEGORY_LABELS[t.category] || t.category}</Text>
                <Text style={styles.cardDate}>{t.date}</Text>
              </View>
              <Text style={[styles.cardAmount, { color: t.type === 'income' ? colors.success : colors.error }]}>
                {t.type === 'income' ? '+' : '-'}₺{Math.abs(t.amount).toLocaleString('tr-TR')}
              </Text>
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
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  summaryCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  incomeCard: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  expenseCard: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  summaryLabel: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: spacing.xs },
  summaryValue: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary, marginTop: 2 },
  balanceCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  balanceLabel: { fontSize: typography.fontSize.sm, color: colors.text.secondary },
  balanceValue: { fontSize: typography.fontSize.xxl, fontWeight: '700', marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  filterBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}20` },
  filterText: { fontSize: typography.fontSize.sm, color: colors.text.secondary, fontWeight: '600' },
  filterTextActive: { color: colors.primary },
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
  addFormRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  addTypeBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.background.secondary, alignItems: 'center' },
  addTypeActive: { backgroundColor: `${colors.primary}30`, borderWidth: 1, borderColor: colors.primary },
  addTypeText: { color: colors.text.secondary, fontWeight: '600' },
  addTypeTextActive: { color: colors.primary, fontWeight: '600' },
  addInput: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  addSubmitBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.sm },
  addSubmitDisabled: { opacity: 0.7 },
  addSubmitText: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.secondary },
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconIncome: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  iconExpense: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  cardContent: { flex: 1 },
  cardDesc: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text.primary },
  cardDate: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: 2 },
  cardAmount: { fontSize: typography.fontSize.md, fontWeight: '700' },
});
