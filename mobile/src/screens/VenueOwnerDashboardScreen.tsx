/**
 * Venue Owner Dashboard – Saha sahibi paneli (Firestore)
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
import { getVenues } from '../services/venues';
import { getReservations } from '../services/finance';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'VenueOwnerDashboard'>;

export default function VenueOwnerDashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const [venues, setVenues] = useState<Array<{ id: string; name: string }>>([]);
  const [reservations, setReservations] = useState<Awaited<ReturnType<typeof getReservations>>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const [vList, rList] = await Promise.all([getVenues(), getReservations()]);
    setVenues(vList.map((v) => ({ id: v.id, name: v.name })));
    setReservations(rList);
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

  const pendingCount = reservations.filter((r) => r.status === 'pending').length;
  const totalRevenue = reservations
    .filter((r) => r.status === 'confirmed' || r.status === 'completed')
    .reduce((s, r) => s + r.price, 0);

  if (loading) {
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
        <Text style={styles.headerTitle}>Saha Paneli</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Icon name="domain" size={28} color={colors.primary} />
            <Text style={styles.statValue}>{venues.length}</Text>
            <Text style={styles.statLabel}>Saha</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="clock-outline" size={28} color={colors.warning} />
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Bekleyen</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="cash" size={28} color={colors.success} />
            <Text style={styles.statValue}>₺{totalRevenue.toLocaleString('tr-TR')}</Text>
            <Text style={styles.statLabel}>Gelir</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('VenueList')}
        >
          <Icon name="domain" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Sahalar</Text>
          <Icon name="chevron-right" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('ReservationManagement')}
        >
          <Icon name="calendar-edit" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Rezervasyon Yönetimi</Text>
          <Icon name="chevron-right" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('VenueFinancialReports')}
        >
          <Icon name="chart-line" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Saha Gelir Raporu</Text>
          <Icon name="chevron-right" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
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
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statValue: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary, marginTop: spacing.xs },
  statLabel: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  menuText: { flex: 1, marginLeft: spacing.md, fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text.primary },
});
