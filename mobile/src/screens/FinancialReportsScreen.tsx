/**
 * Financial Reports Screen – Gelir/Gider raporları (Firestore) + görsel grafikler
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
  Dimensions,
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

const { width: SCREEN_W } = Dimensions.get('window');
const BAR_MAX_H = 100;

const CATEGORY_LABELS: Record<string, string> = {
  gelir: 'Gelir',
  aidat: 'Aidat',
  saha_kirasi: 'Saha Kirası',
  ekipman: 'Ekipman',
  diger: 'Diğer',
};

const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// ─────────────────────────────────────────
// Mini Bar Chart Component
// ─────────────────────────────────────────
function MiniBarChart({ income, expense, maxVal }: { income: number; expense: number; maxVal: number }) {
  const iH = maxVal > 0 ? (income / maxVal) * BAR_MAX_H : 0;
  const eH = maxVal > 0 ? (expense / maxVal) * BAR_MAX_H : 0;
  return (
    <View style={chartStyles.bars}>
      <View style={chartStyles.barGroup}>
        <View style={[chartStyles.bar, { height: Math.max(iH, 4), backgroundColor: colors.success }]} />
        <Text style={chartStyles.barLabel}>G</Text>
      </View>
      <View style={chartStyles.barGroup}>
        <View style={[chartStyles.bar, { height: Math.max(eH, 4), backgroundColor: colors.error }]} />
        <Text style={chartStyles.barLabel}>H</Text>
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: BAR_MAX_H + 24, paddingBottom: 20 },
  barGroup: { alignItems: 'center' },
  bar: { width: 14, borderRadius: 4 },
  barLabel: { fontSize: 8, color: colors.text.tertiary, marginTop: 2, fontWeight: '700' },
});

// ─────────────────────────────────────────
// Category Donut (simple pie replacement)
// ─────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  aidat: '#10B981',
  saha_kirasi: '#EF4444',
  ekipman: '#F59E0B',
  gelir: '#3B82F6',
  diger: '#8B5CF6',
};

// ─────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────
export default function FinancialReportsScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [activeTab, setActiveTab] = useState<'list' | 'chart'>('list');
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

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = totalIncome - totalExpense;

  // Monthly aggregation for chart (last 6 months)
  const monthlyData = (() => {
    const now = new Date();
    const months: { key: string; label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      months.push({ key, label: MONTHS_TR[d.getMonth()], income: 0, expense: 0 });
    }
    for (const t of transactions) {
      const month = t.date.slice(0, 7);
      const m = months.find((x) => x.key === month);
      if (m) {
        if (t.type === 'income') m.income += Math.abs(t.amount);
        else m.expense += Math.abs(t.amount);
      }
    }
    return months;
  })();

  const chartMax = Math.max(...monthlyData.map((m) => Math.max(m.income, m.expense)), 1);

  // Category breakdown
  const categoryBreakdown = (() => {
    const cats: Record<string, number> = {};
    for (const t of transactions.filter((x) => x.type === 'expense')) {
      const cat = t.category || 'diger';
      cats[cat] = (cats[cat] || 0) + Math.abs(t.amount);
    }
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  })();

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
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* View Toggle */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'list' && styles.tabActive]} onPress={() => setActiveTab('list')}>
          <Icon name="format-list-bulleted" size={16} color={activeTab === 'list' ? colors.primary : colors.text.secondary} />
          <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>İşlemler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'chart' && styles.tabActive]} onPress={() => setActiveTab('chart')}>
          <Icon name="chart-bar" size={16} color={activeTab === 'chart' ? colors.primary : colors.text.secondary} />
          <Text style={[styles.tabText, activeTab === 'chart' && styles.tabTextActive]}>Grafikler</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderTopWidth: 3, borderTopColor: colors.success }]}>
            <Icon name="trending-up" size={22} color={colors.success} />
            <Text style={styles.summaryLabel}>Gelir</Text>
            <Text style={styles.summaryValue}>₺{totalIncome.toLocaleString('tr-TR')}</Text>
          </View>
          <View style={[styles.summaryCard, { borderTopWidth: 3, borderTopColor: colors.error }]}>
            <Icon name="trending-down" size={22} color={colors.error} />
            <Text style={styles.summaryLabel}>Gider</Text>
            <Text style={styles.summaryValue}>₺{totalExpense.toLocaleString('tr-TR')}</Text>
          </View>
        </View>

        {/* Balance */}
        <View style={[styles.balanceCard, { borderLeftWidth: 4, borderLeftColor: balance >= 0 ? colors.success : colors.error }]}>
          <View>
            <Text style={styles.balanceLabel}>Net Bakiye</Text>
            <Text style={styles.balancePeriod}>Tüm zamanlar</Text>
          </View>
          <Text style={[styles.balanceValue, { color: balance >= 0 ? colors.success : colors.error }]}>
            {balance >= 0 ? '+' : ''}₺{Math.abs(balance).toLocaleString('tr-TR')}
          </Text>
        </View>

        {activeTab === 'list' ? (
          <>
            {/* Add Form */}
            {showAddForm && (
              <View style={styles.addForm}>
                <Text style={styles.addFormTitle}>İşlem Ekle</Text>
                <View style={styles.addFormRow}>
                  <TouchableOpacity style={[styles.addTypeBtn, addType === 'income' && styles.addTypeActive]} onPress={() => setAddType('income')}>
                    <Icon name="trending-up" size={16} color={addType === 'income' ? colors.success : colors.text.secondary} />
                    <Text style={addType === 'income' ? styles.addTypeTextActive : styles.addTypeText}>Gelir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.addTypeBtn, addType === 'expense' && styles.addTypeActive]} onPress={() => setAddType('expense')}>
                    <Icon name="trending-down" size={16} color={addType === 'expense' ? colors.error : colors.text.secondary} />
                    <Text style={addType === 'expense' ? styles.addTypeTextActive : styles.addTypeText}>Gider</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={styles.addInput} value={addAmount} onChangeText={setAddAmount} placeholder="Tutar (₺)" placeholderTextColor={colors.text.disabled} keyboardType="numeric" />
                <TextInput style={styles.addInput} value={addDesc} onChangeText={setAddDesc} placeholder="Açıklama" placeholderTextColor={colors.text.disabled} />
                <TextInput style={styles.addInput} value={addDate} onChangeText={setAddDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.text.disabled} />
                <TouchableOpacity style={[styles.addSubmitBtn, addSubmitting && styles.addSubmitDisabled]} onPress={handleAddTransaction} disabled={addSubmitting}>
                  {addSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addSubmitText}>Ekle</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* Filter */}
            <View style={styles.filterRow}>
              {(['all', 'income', 'expense'] as const).map((f) => (
                <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
                  <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                    {f === 'all' ? 'Tümü' : f === 'income' ? 'Gelir' : 'Gider'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* List */}
            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <Icon name="chart-bar" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>İşlem bulunamadı</Text>
              </View>
            ) : (
              filtered.map((t) => (
                <View key={t.id} style={styles.card}>
                  <View style={[styles.cardIcon, t.type === 'income' ? styles.iconIncome : styles.iconExpense]}>
                    <Icon name={t.type === 'income' ? 'cash-plus' : 'cash-minus'} size={20} color={t.type === 'income' ? colors.success : colors.error} />
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
          </>
        ) : (
          <>
            {/* Chart Tab */}
            <Text style={styles.chartSectionTitle}>SON 6 AY GELİR / GİDER</Text>
            <View style={styles.chartCard}>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.legendText}>Gelir</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                  <Text style={styles.legendText}>Gider</Text>
                </View>
              </View>
              <View style={styles.chartBars}>
                {monthlyData.map((m) => (
                  <View key={m.key} style={styles.monthGroup}>
                    <MiniBarChart income={m.income} expense={m.expense} maxVal={chartMax} />
                    <Text style={styles.monthLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Category Breakdown */}
            <Text style={[styles.chartSectionTitle, { marginTop: spacing.xl }]}>GİDER KATEGORİLERİ</Text>
            {categoryBreakdown.length === 0 ? (
              <Text style={styles.emptyText}>Gider kaydı yok</Text>
            ) : (
              <View style={styles.categoryCard}>
                {categoryBreakdown.map(([cat, amount]) => {
                  const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                  return (
                    <View key={cat} style={styles.categoryRow}>
                      <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[cat] || colors.primary }]} />
                      <Text style={styles.categoryLabel}>{CATEGORY_LABELS[cat] || cat}</Text>
                      <View style={styles.categoryBarBg}>
                        <View style={[styles.categoryBarFill, { width: `${pct}%` as any, backgroundColor: CATEGORY_COLORS[cat] || colors.primary }]} />
                      </View>
                      <Text style={styles.categoryAmount}>₺{amount.toLocaleString('tr-TR')}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Monthly Table */}
            <Text style={[styles.chartSectionTitle, { marginTop: spacing.xl }]}>AYLIK ÖZET</Text>
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1 }]}>Ay</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, { width: 80 }]}>Gelir</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, { width: 80 }]}>Gider</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, { width: 70 }]}>Fark</Text>
              </View>
              {monthlyData.map((m) => {
                const diff = m.income - m.expense;
                return (
                  <View key={m.key} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{m.label}</Text>
                    <Text style={[styles.tableCell, { width: 80, color: colors.success }]}>₺{m.income.toLocaleString('tr-TR')}</Text>
                    <Text style={[styles.tableCell, { width: 80, color: colors.error }]}>₺{m.expense.toLocaleString('tr-TR')}</Text>
                    <Text style={[styles.tableCell, { width: 70, color: diff >= 0 ? colors.success : colors.error, fontWeight: '700' }]}>
                      {diff >= 0 ? '+' : ''}₺{Math.abs(diff).toLocaleString('tr-TR')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.text.secondary },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 56,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
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
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  summaryCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border.light,
  },
  summaryLabel: { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 4 },
  summaryValue: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary, marginTop: 2 },
  // Balance
  balanceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border.light,
  },
  balanceLabel: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary },
  balancePeriod: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: 2 },
  balanceValue: { fontSize: typography.fontSize.xl, fontWeight: '800' },
  // Add Form
  addForm: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border.light },
  addFormTitle: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.md },
  addFormRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  addTypeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.background.secondary },
  addTypeActive: { backgroundColor: `${colors.primary}15`, borderWidth: 1, borderColor: colors.primary },
  addTypeText: { color: colors.text.secondary, fontWeight: '600', fontSize: typography.fontSize.sm },
  addTypeTextActive: { color: colors.primary, fontWeight: '600', fontSize: typography.fontSize.sm },
  addInput: { backgroundColor: colors.background.primary, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.fontSize.md, color: colors.text.primary, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border.light },
  addSubmitBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.sm },
  addSubmitDisabled: { opacity: 0.7 },
  addSubmitText: { fontSize: typography.fontSize.md, fontWeight: '700', color: '#fff' },
  // Filter
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  filterBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1, borderColor: colors.border.light },
  filterBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
  filterText: { fontSize: typography.fontSize.sm, color: colors.text.secondary, fontWeight: '600' },
  filterTextActive: { color: colors.primary },
  // List
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { marginTop: spacing.md, color: colors.text.secondary },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: 6, borderWidth: 1, borderColor: colors.border.light },
  cardIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  iconIncome: { backgroundColor: 'rgba(16,185,129,0.15)' },
  iconExpense: { backgroundColor: 'rgba(239,68,68,0.15)' },
  cardContent: { flex: 1 },
  cardDesc: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text.primary },
  cardDate: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: 2 },
  cardAmount: { fontSize: typography.fontSize.md, fontWeight: '700' },
  // Chart
  chartSectionTitle: { fontSize: 10, fontWeight: '700', color: colors.text.tertiary, letterSpacing: 1.5, marginBottom: spacing.md },
  chartCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border.light, marginBottom: spacing.md },
  chartLegend: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: typography.fontSize.xs, color: colors.text.secondary, fontWeight: '600' },
  chartBars: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  monthGroup: { alignItems: 'center' },
  monthLabel: { fontSize: 9, color: colors.text.tertiary, fontWeight: '600', marginTop: 4 },
  // Category
  categoryCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border.light },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryLabel: { fontSize: typography.fontSize.xs, color: colors.text.secondary, width: 80 },
  categoryBarBg: { flex: 1, height: 8, backgroundColor: colors.border.light, borderRadius: 4, overflow: 'hidden' },
  categoryBarFill: { height: '100%', borderRadius: 4 },
  categoryAmount: { fontSize: typography.fontSize.xs, fontWeight: '700', color: colors.text.primary, width: 70, textAlign: 'right' },
  // Table
  tableCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border.light },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.background.secondary, padding: spacing.sm },
  tableRow: { flexDirection: 'row', padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border.light },
  tableCell: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  tableCellHeader: { fontWeight: '700', color: colors.text.tertiary },
});
