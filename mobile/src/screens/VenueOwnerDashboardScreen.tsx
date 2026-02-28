/**
 * Venue Owner Dashboard – Saha sahibi / partner paneli
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { getVenues } from '../services/venues';
import { getReservations } from '../services/finance';
import AppScrollView from '../components/AppScrollView';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'VenueOwnerDashboard'>;

interface MenuItem {
  icon: string;
  label: string;
  sublabel?: string;
  color: string;
  onPress: () => void;
  badge?: number;
}

export default function VenueOwnerDashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const [venues, setVenues] = useState<Array<{ id: string; name: string; pricePerHour: number }>>([]);
  const [reservations, setReservations] = useState<Awaited<ReturnType<typeof getReservations>>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const [vList, rList] = await Promise.all([getVenues(), getReservations()]);
    setVenues(vList.map((v) => ({ id: v.id, name: v.name, pricePerHour: v.pricePerHour })));
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
  const confirmedCount = reservations.filter((r) => r.status === 'confirmed' || r.status === 'completed').length;
  const totalRevenue = reservations
    .filter((r) => r.status === 'confirmed' || r.status === 'completed')
    .reduce((s, r) => s + r.price, 0);
  const todayRes = reservations.filter((r) => {
    const today = new Date().toISOString().slice(0, 10);
    return r.date === today;
  }).length;

  const menuItems: MenuItem[] = [
    {
      icon: 'domain',
      label: 'Sahalar',
      sublabel: `${venues.length} aktif saha`,
      color: '#10B981',
      onPress: () => navigation.navigate('VenueList'),
    },
    {
      icon: 'calendar-edit',
      label: 'Rezervasyon Yönetimi',
      sublabel: `${pendingCount} bekleyen`,
      color: '#3B82F6',
      onPress: () => navigation.navigate('ReservationManagement'),
      badge: pendingCount,
    },
    {
      icon: 'calendar-month',
      label: 'Saha Takvimi',
      sublabel: `Bugün ${todayRes} rezervasyon`,
      color: '#8B5CF6',
      onPress: () => navigation.navigate('VenueCalendar'),
    },
    {
      icon: 'chart-line',
      label: 'Gelir Raporları',
      sublabel: `₺${totalRevenue.toLocaleString('tr-TR')} toplam`,
      color: '#F59E0B',
      onPress: () => navigation.navigate('VenueFinancialReports'),
    },
    {
      icon: 'account-tie',
      label: 'Müşteri Yönetimi',
      sublabel: 'CRM ve müşteri listesi',
      color: '#EC4899',
      onPress: () => navigation.navigate('CustomerManagement'),
    },
    {
      icon: 'plus-circle',
      label: 'Yeni Saha Ekle',
      sublabel: 'Tesisini platforma ekle',
      color: '#14B8A6',
      onPress: () => navigation.navigate('VenueAdd'),
    },
    {
      icon: 'calendar-check',
      label: 'Rezervasyon Sistemi',
      sublabel: 'Online rezervasyon',
      color: '#06B6D4',
      onPress: () => navigation.navigate('ReserveSystem'),
    },
    {
      icon: 'whatsapp',
      label: 'WhatsApp Entegrasyonu',
      sublabel: 'Otomatik mesajlaşma',
      color: '#25D366',
      onPress: () => navigation.navigate('WhatsAppIntegration'),
    },
  ];

  const recentReservations = [...reservations]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

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
        <View>
          <Text style={styles.headerTitle}>Saha Sahibi Paneli</Text>
          <Text style={styles.headerSub}>Partner Dashboard</Text>
        </View>
        <View style={[styles.backBtn, { backgroundColor: '#F59E0B22' }]}>
          <Icon name="crown" size={22} color="#F59E0B" />
        </View>
      </View>

      <AppScrollView
        style={styles.content}
        contentContainerStyle={{}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Stats Row */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#10B98122' }]}>
              <Icon name="domain" size={22} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{venues.length}</Text>
            <Text style={styles.statLabel}>Toplam Saha</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B22' }]}>
              <Icon name="clock-alert" size={22} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, pendingCount > 0 && { color: '#F59E0B' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Bekleyen Rez.</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#3B82F622' }]}>
              <Icon name="calendar-check" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{confirmedCount}</Text>
            <Text style={styles.statLabel}>Onaylanan</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#A855F722' }]}>
              <Icon name="cash-multiple" size={22} color="#A855F7" />
            </View>
            <Text style={styles.statValue}>₺{(totalRevenue / 1000).toFixed(1)}K</Text>
            <Text style={styles.statLabel}>Toplam Gelir</Text>
          </View>
        </View>

        {/* Quick Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueLeft}>
            <Text style={styles.revenueLabel}>Bu Ay Gelir</Text>
            <Text style={styles.revenueValue}>₺{totalRevenue.toLocaleString('tr-TR')}</Text>
            <View style={styles.revenueTrend}>
              <Icon name="trending-up" size={14} color={colors.success} />
              <Text style={styles.revenueTrendText}>+12% geçen aya göre</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.revenueBtn}
            onPress={() => navigation.navigate('VenueFinancialReports')}
          >
            <Text style={styles.revenueBtnText}>Rapor Görüntüle</Text>
            <Icon name="arrow-right" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Menu Grid */}
        <Text style={styles.sectionTitle}>YÖNETİM</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.menuCard}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}18` }]}>
                <Icon name={item.icon as any} size={26} color={item.color} />
                {item.badge != null && item.badge > 0 && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.sublabel && <Text style={styles.menuSublabel} numberOfLines={1}>{item.sublabel}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Reservations */}
        {recentReservations.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SON REZERVASYONLar</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ReservationManagement')}>
                <Text style={styles.seeAll}>Tümü →</Text>
              </TouchableOpacity>
            </View>
            {recentReservations.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.resCard}
                onPress={() => navigation.navigate('ReservationDetails', { reservationId: r.id })}
              >
                <View style={styles.resLeft}>
                  <Text style={styles.resVenue}>{r.venueName || 'Saha'}</Text>
                  <Text style={styles.resDate}>{r.date} • {r.startTime} – {r.endTime}</Text>
                  {r.teamName && <Text style={styles.resTeam}>{r.teamName}</Text>}
                </View>
                <View style={styles.resRight}>
                  <Text style={styles.resPrice}>₺{r.price.toLocaleString('tr-TR')}</Text>
                  <View style={[
                    styles.resBadge,
                    r.status === 'confirmed' || r.status === 'completed'
                      ? styles.resBadgeOk
                      : r.status === 'cancelled'
                      ? styles.resBadgeCancelled
                      : styles.resBadgePending,
                  ]}>
                    <Text style={styles.resBadgeText}>
                      {r.status === 'confirmed' ? 'Onaylı'
                        : r.status === 'completed' ? 'Tamamlandı'
                        : r.status === 'cancelled' ? 'İptal'
                        : 'Bekliyor'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </AppScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.text.secondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '800', color: colors.text.primary },
  headerSub: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  content: { flex: 1 },
  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: 0,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue: { fontSize: typography.fontSize.lg, fontWeight: '800', color: colors.text.primary },
  statLabel: { fontSize: 9, color: colors.text.secondary, textAlign: 'center', marginTop: 2 },
  // Revenue Card
  revenueCard: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  revenueLeft: { flex: 1 },
  revenueLabel: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  revenueValue: { fontSize: 28, fontWeight: '800', color: colors.text.primary, marginVertical: 4 },
  revenueTrend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  revenueTrendText: { fontSize: typography.fontSize.xs, color: colors.success },
  revenueBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${colors.primary}18`, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  revenueBtnText: { fontSize: typography.fontSize.xs, color: colors.primary, fontWeight: '700' },
  // Menu Grid
  sectionTitle: { fontSize: typography.fontSize.xs, fontWeight: '700', color: colors.text.tertiary, letterSpacing: 1.5, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  seeAll: { fontSize: typography.fontSize.xs, color: colors.primary, fontWeight: '700' },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  menuCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  menuIcon: { width: 52, height: 52, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm, position: 'relative' },
  menuBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: colors.error, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  menuBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  menuLabel: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.text.primary, marginBottom: 2 },
  menuSublabel: { fontSize: 10, color: colors.text.secondary },
  // Recent Reservations
  resCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  resLeft: { flex: 1 },
  resVenue: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.text.primary },
  resDate: { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  resTeam: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: 2 },
  resRight: { alignItems: 'flex-end', gap: 6 },
  resPrice: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary },
  resBadge: { borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  resBadgeOk: { backgroundColor: '#10B98120' },
  resBadgePending: { backgroundColor: '#F59E0B20' },
  resBadgeCancelled: { backgroundColor: '#EF444420' },
  resBadgeText: { fontSize: 10, fontWeight: '700', color: colors.text.secondary },
});
