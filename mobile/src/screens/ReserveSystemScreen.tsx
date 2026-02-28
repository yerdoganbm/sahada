/**
 * Reserve System Screen – Rezervasyon listesi (Firestore)
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

type NavProp = StackNavigationProp<RootStackParamList, 'ReserveSystem'>;

const STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  confirmed: 'Onaylı',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

export default function ReserveSystemScreen() {
  const navigation = useNavigation<NavProp>();
  const [items, setItems] = useState<Awaited<ReturnType<typeof getReservations>>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        <Text style={styles.headerTitle}>Rezervasyonlar</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('Booking')}>
          <Icon name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <AppScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="calendar-check" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Rezervasyon bulunamadı</Text>
            <TouchableOpacity
              style={styles.addResBtn}
              onPress={() => navigation.navigate('Booking')}
            >
              <Text style={styles.addResText}>Rezervasyon Oluştur</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.venueName}>{r.venueName}</Text>
                <View style={[styles.statusBadge, r.status === 'cancelled' && styles.statusCancel]}>
                  <Text style={styles.statusText}>{STATUS_LABELS[r.status] || r.status}</Text>
                </View>
              </View>
              <Text style={styles.dateText}>{r.date} • {r.startTime} - {r.endTime}</Text>
              {r.teamName && <Text style={styles.teamText}>{r.teamName}</Text>}
              {r.price > 0 && (
                <Text style={styles.priceText}>₺{r.price.toLocaleString('tr-TR')}</Text>
              )}
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
  addBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  contentInner: { padding: spacing.lg, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { marginTop: spacing.md, color: colors.text.secondary },
  addResBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  addResText: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.secondary },
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
