/**
 * Venue Financial Reports Screen – Saha gelir raporları (Firestore reservations)
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
import { getVenues } from '../services/venues';
import AppScrollView from '../components/AppScrollView';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import type { Reservation } from '../services/finance';

type NavProp = StackNavigationProp<RootStackParamList, 'VenueFinancialReports'>;

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Onaylı',
  completed: 'Tamamlandı',
  pending: 'Bekliyor',
  cancelled: 'İptal',
};

export default function VenueFinancialReportsScreen() {
  const navigation = useNavigation<NavProp>();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [venues, setVenues] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const [resList, venList] = await Promise.all([
      getReservations(),
      getVenues(),
    ]);
    setReservations(resList);
    setVenues(venList.map((v) => ({ id: v.id, name: v.name })));
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

  const byVenue = venues.map((v) => {
    const res = reservations.filter(
      (r) => r.venueId === v.id || r.venueName === v.name
    );
    const completed = res.filter((r) => r.status === 'completed' || r.status === 'confirmed');
    const total = completed.reduce((s, r) => s + r.price, 0);
    const count = completed.length;
    return {
      id: v.id,
      name: v.name,
      total,
      count,
      reservations: res,
    };
  });

  const grandTotal = byVenue.reduce((s, v) => s + v.total, 0);

  if (loading && reservations.length === 0) {
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
        <Text style={styles.headerTitle}>Saha Gelir Raporu</Text>
        <View style={styles.placeholder} />
      </View>

      <AppScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.summaryCard}>
          <Icon name="chart-line" size={32} color={colors.primary} />
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Toplam Gelir</Text>
            <Text style={styles.summaryValue}>₺{grandTotal.toLocaleString('tr-TR')}</Text>
          </View>
        </View>

        {byVenue.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="domain" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Saha veya rezervasyon bulunamadı</Text>
          </View>
        ) : (
          byVenue.map((v) => (
            <View key={v.id} style={styles.venueCard}>
              <View style={styles.venueHeader}>
                <Icon name="domain" size={24} color={colors.primary} />
                <Text style={styles.venueName}>{v.name}</Text>
                <Text style={styles.venueTotal}>₺{v.total.toLocaleString('tr-TR')}</Text>
              </View>
              <Text style={styles.venueCount}>{v.count} rezervasyon</Text>
              {v.reservations.slice(0, 5).map((r) => (
                <View key={r.id} style={styles.resRow}>
                  <Text style={styles.resDate}>{r.date} {r.startTime}</Text>
                  <View style={[styles.resBadge, r.status === 'cancelled' && styles.resBadgeCancel]}>
                    <Text style={styles.resBadgeText}>
                      {STATUS_LABELS[r.status] || r.status}
                    </Text>
                  </View>
                  <Text style={styles.resPrice}>₺{r.price.toLocaleString('tr-TR')}</Text>
                </View>
              ))}
              {v.reservations.length > 5 && (
                <Text style={styles.moreText}>+{v.reservations.length - 5} kayıt daha</Text>
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
  placeholder: { width: 40 },
  content: { flex: 1 },
  contentInner: { padding: spacing.lg, paddingBottom: 100 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
    marginBottom: spacing.xl,
  },
  summaryText: { marginLeft: spacing.md },
  summaryLabel: { fontSize: typography.fontSize.sm, color: colors.text.secondary },
  summaryValue: { fontSize: typography.fontSize.xxl, fontWeight: '700', color: colors.primary, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { marginTop: spacing.md, color: colors.text.secondary },
  venueCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  venueHeader: { flexDirection: 'row', alignItems: 'center' },
  venueName: { flex: 1, marginLeft: spacing.md, fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary },
  venueTotal: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.primary },
  venueCount: { fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginTop: spacing.xs, marginLeft: 36 },
  resRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  resDate: { flex: 1, fontSize: typography.fontSize.sm, color: colors.text.secondary },
  resBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}30`,
    marginRight: spacing.md,
  },
  resBadgeCancel: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  resBadgeText: { fontSize: typography.fontSize.xs, color: colors.text.primary, fontWeight: '600' },
  resPrice: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text.primary },
  moreText: { marginTop: spacing.sm, fontSize: typography.fontSize.xs, color: colors.text.tertiary },
});
