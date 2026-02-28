/**
 * Reservation Management Screen – Rezervasyon yönetimi (Firestore)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { getReservations } from '../services/finance';
import AppScrollView from '../components/AppScrollView';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'ReservationManagement'>;

const STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  confirmed: 'Onaylı',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

export default function ReservationManagementScreen() {
  const navigation = useNavigation<NavProp>();
  const [items, setItems] = useState<Awaited<ReturnType<typeof getReservations>>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

  const fetchData = useCallback(async () => {
    const list = await getReservations();
    setItems(list);
  }, []);

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
    ? items
    : filter === 'pending'
      ? items.filter((r) => r.status === 'pending')
      : items.filter((r) => r.status === 'confirmed' || r.status === 'completed');

  if (loading && items.length === 0) {
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
        <Text style={styles.headerTitle}>Rezervasyon Yönetimi</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.filterRow}>
        {(['all', 'pending', 'confirmed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekleyen' : 'Onaylı'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <AppScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="calendar-edit" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Rezervasyon bulunamadı</Text>
          </View>
        ) : (
          filtered.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.venueName}>{r.venueName}</Text>
                <View style={[styles.statusBadge, r.status === 'cancelled' && styles.statusCancel]}>
                  <Text style={styles.statusText}>{STATUS_LABELS[r.status] || r.status}</Text>
                </View>
              </View>
              <Text style={styles.dateText}>{r.date} • {r.startTime} - {r.endTime}</Text>
              {r.teamName && <Text style={styles.teamText}>{r.teamName}</Text>}
              {r.price > 0 && <Text style={styles.priceText}>₺{r.price.toLocaleString('tr-TR')}</Text>}
            </View>
          ))
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
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
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
  content: { flex: 1 },
  contentInner: { padding: spacing.lg, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { marginTop: spacing.md, color: colors.text.secondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  venueName: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}30`,
  },
  statusCancel: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  statusText: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.text.primary },
  dateText: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: spacing.xs },
  teamText: { fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginTop: 2 },
  priceText: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.primary, marginTop: 4 },
});
