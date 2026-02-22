/**
 * Venue List Screen – Sahalar listesi (Firestore)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { getVenues } from '../services/venues';
import type { Venue } from '../types';

type VenueListNavProp = StackNavigationProp<RootStackParamList, 'VenueList'>;

export default function VenueListScreen() {
  const navigation = useNavigation<VenueListNavProp>();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVenues = useCallback(async () => {
    const list = await getVenues();
    setVenues(list);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVenues().then((list) => {
      if (!cancelled) setVenues(list);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVenues();
    setRefreshing(false);
  }, [fetchVenues]);

  if (loading && venues.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Sahalar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sahalar</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={venues}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, venues.length === 0 && styles.listEmpty]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="map-marker-off" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Henüz saha kaydı yok</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
              <Text style={styles.retryBtnText}>Yenile</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('VenueDetails', { venueId: item.id })}
            activeOpacity={0.8}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.cardImage} />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                <Icon name="soccer-field" size={32} color={colors.text.tertiary} />
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardLocation} numberOfLines={1}>
                {item.location || 'Konum belirtilmemiş'}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.cardBadge}>
                  <Icon name="cash" size={14} color={colors.primary} />
                  <Text style={styles.cardPrice}>{item.pricePerHour}₺/saat</Text>
                </View>
                {item.rating > 0 && (
                  <View style={styles.cardBadge}>
                    <Icon name="star" size={14} color={colors.warning} />
                    <Text style={styles.cardRating}>{item.rating}</Text>
                  </View>
                )}
              </View>
            </View>
            <Icon name="chevron-right" size={22} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, fontSize: typography.fontSize.sm, color: colors.text.secondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 24 : 56,
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
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  placeholder: { width: 40 },
  list: { padding: spacing.lg, paddingBottom: 100 },
  listEmpty: { flex: 1 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  retryBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardImage: {
    width: 80,
    height: 80,
    backgroundColor: colors.background.secondary,
  },
  cardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1, padding: spacing.md },
  cardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  cardLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  cardFooter: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardPrice: { fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: '600' },
  cardRating: { fontSize: typography.fontSize.sm, color: colors.warning, fontWeight: '600' },
});
