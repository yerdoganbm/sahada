/**
 * Debt List Screen – Borç listesi (bekleyen ödemeler) (Firestore)
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getPayments } from '../services/finance';
import { getTeamIdForUser } from '../services/players';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'DebtList'>;

export default function DebtListScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [debts, setDebts] = useState<Array<{ id: string; playerName: string; amount: number; month: string; dueDate?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const teamId = user?.id ? await getTeamIdForUser(user.id) : undefined;
    const list = await getPayments(teamId ? { teamId, status: 'PENDING' } : { status: 'PENDING' });
    setDebts(list);
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

  const totalDebt = debts.reduce((s, d) => s + d.amount, 0);

  if (loading && debts.length === 0) {
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
        <Text style={styles.headerTitle}>Borç Listesi</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.summaryCard}>
          <Icon name="cash-minus" size={32} color={colors.warning} />
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Toplam Bekleyen Borç</Text>
            <Text style={styles.summaryValue}>₺{totalDebt.toLocaleString('tr-TR')}</Text>
          </View>
        </View>

        {debts.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="check-circle" size={48} color={colors.success} />
            <Text style={styles.emptyText}>Bekleyen borç yok</Text>
            <Text style={styles.emptySub}>Tüm ödemeler tamamlanmış.</Text>
          </View>
        ) : (
          debts.map((d) => (
            <View key={d.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Icon name="account" size={24} color={colors.warning} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{d.playerName || 'Üye'}</Text>
                <Text style={styles.cardMonth}>
                  {d.month || d.dueDate || '-'}
                  {d.dueDate ? ` • Vade: ${d.dueDate}` : ''}
                </Text>
              </View>
              <Text style={styles.cardAmount}>₺{d.amount.toLocaleString('tr-TR')}</Text>
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: spacing.xl,
  },
  summaryText: { marginLeft: spacing.md },
  summaryLabel: { fontSize: typography.fontSize.sm, color: colors.text.secondary },
  summaryValue: { fontSize: typography.fontSize.xxl, fontWeight: '700', color: colors.warning, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { marginTop: spacing.md, fontSize: typography.fontSize.md, color: colors.text.primary, fontWeight: '600' },
  emptySub: { marginTop: spacing.xs, color: colors.text.secondary },
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
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: { flex: 1 },
  cardName: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text.primary },
  cardMonth: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: 2 },
  cardAmount: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.warning },
});
