/**
 * VenueCalendarScreen – Rezervasyon takvimi (Firestore)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { getReservations } from '../services/finance';
import { getVenues } from '../services/venues';
import type { Reservation } from '../services/firestore';
import type { Venue } from '../types';

type VenueCalendarNavProp = StackNavigationProp<RootStackParamList, 'VenueCalendar'>;

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylı',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

function groupByDate(items: Reservation[]): Array<{ date: string; items: Reservation[] }> {
  const map = new Map<string, Reservation[]>();
  for (const r of items) {
    const arr = map.get(r.date) ?? [];
    arr.push(r);
    map.set(r.date, arr);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, items]) => ({ date, items }));
}

export default function VenueCalendarScreen() {
  const navigation = useNavigation<VenueCalendarNavProp>();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const [rList, vList] = await Promise.all([
      getReservations(selectedVenueId ?? undefined),
      getVenues(),
    ]);
    setReservations(rList);
    setVenues(vList);
  }, [selectedVenueId]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const grouped = groupByDate(reservations);
  type ListItem = { type: 'header'; key: string; date: string } | { type: 'item'; key: string } & Reservation;
  const flatData: ListItem[] = grouped.flatMap((g) => [
    { type: 'header' as const, key: g.date, date: g.date },
    ...g.items.map((r) => ({ type: 'item' as const, key: r.id, ...r })),
  ]);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      const d = new Date(item.date);
      const label = d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
      return (
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>{label}</Text>
        </View>
      );
    }
    const r = item as { type: 'item'; key: string } & Reservation;
    const statusLabel = STATUS_LABELS[r.status] ?? r.status;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ReservationDetails', { reservationId: r.id })}
      >
        <View style={styles.cardRow}>
          <Icon name="clock-outline" size={18} color={colors.text.secondary} />
          <Text style={styles.cardTime}>
            {r.startTime} – {r.endTime}
          </Text>
        </View>
        <Text style={styles.cardVenue}>{r.venueName}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>₺{r.price}</Text>
          <View style={[styles.statusBadge, { backgroundColor: r.status === 'confirmed' ? colors.success : r.status === 'cancelled' ? colors.error : colors.warning }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saha Takvimi</Text>
        <View style={styles.placeholder} />
      </View>

      {venues.length > 1 && (
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedVenueId && styles.filterChipActive]}
            onPress={() => setSelectedVenueId(null)}
          >
            <Text style={[styles.filterText, !selectedVenueId && styles.filterTextActive]}>Tümü</Text>
          </TouchableOpacity>
          {venues.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={[styles.filterChip, selectedVenueId === v.id && styles.filterChipActive]}
              onPress={() => setSelectedVenueId(v.id)}
            >
              <Text style={[styles.filterText, selectedVenueId === v.id && styles.filterTextActive]} numberOfLines={1}>
                {v.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading && reservations.length === 0 ? (
        <View style={[styles.centered, styles.flex1]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : flatData.length === 0 ? (
        <View style={[styles.centered, styles.flex1]}>
          <Icon name="calendar-blank-outline" size={64} color={colors.text.disabled} />
          <Text style={styles.emptyText}>Rezervasyon yok</Text>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  flex1: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.text.secondary, marginTop: spacing.md },
  emptyText: { ...typography.body, color: colors.text.secondary, marginTop: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, ...typography.h3, color: colors.text.primary, textAlign: 'center' },
  placeholder: { width: 40 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { ...typography.caption, color: colors.text.secondary },
  filterTextActive: { color: '#fff' },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
  dateHeader: { marginTop: spacing.lg, marginBottom: spacing.sm },
  dateHeaderText: { ...typography.h3, color: colors.text.primary },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTime: { ...typography.body, color: colors.text.primary },
  cardVenue: { ...typography.caption, color: colors.text.secondary, marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  cardPrice: { ...typography.caption, color: colors.primary },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  statusText: { ...typography.caption, color: '#fff', fontSize: 10 },
});
