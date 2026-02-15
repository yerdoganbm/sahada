/**
 * Matches Screen - List of all matches (API)
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { getMatches } from '../services/matches';
import type { Match } from '../types';

type MatchesNavigationProp = StackNavigationProp<RootStackParamList>;

type FilterType = 'upcoming' | 'past';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isUpcoming(m: Match): boolean {
  if (m.status === 'completed') return false;
  const d = new Date(m.date);
  d.setHours(23, 59, 59, 999);
  return d >= new Date();
}

export default function MatchesScreen() {
  const navigation = useNavigation<MatchesNavigationProp>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('upcoming');

  const fetchMatches = useCallback(async () => {
    const list = await getMatches();
    setMatches(list);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMatches().then((list) => {
      if (!cancelled) {
        setMatches(list);
      }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, [fetchMatches]);

  const upcoming = matches.filter(isUpcoming);
  const past = matches.filter((m) => !isUpcoming(m));
  const displayList = filter === 'upcoming' ? upcoming : past;
  const upcomingCount = upcoming.length;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      tabBarBadge: upcomingCount > 0 ? upcomingCount : undefined,
    } as any);
  }, [navigation, upcomingCount]);

  if (loading && matches.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Maçlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Maçlar</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'upcoming' && styles.filterPillActive]}
            onPress={() => setFilter('upcoming')}
          >
            <Text style={[styles.filterPillText, filter === 'upcoming' && styles.filterPillTextActive]}>
              Yaklaşan
            </Text>
            {upcomingCount > 0 && (
              <View style={[styles.filterBadge, filter !== 'upcoming' && styles.filterBadgeInactive]}>
                <Text style={styles.filterBadgeText}>{upcomingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'past' && styles.filterPillActive]}
            onPress={() => setFilter('past')}
          >
            <Text style={[styles.filterPillText, filter === 'past' && styles.filterPillTextActive]}>
              Geçmiş
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, displayList.length === 0 && styles.listEmpty]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="soccer" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>
              {filter === 'upcoming' ? 'Yaklaşan maç yok' : 'Geçmiş maç yok'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.matchCard}
            onPress={() => navigation.navigate('MatchDetails', { matchId: item.id })}
            activeOpacity={0.8}
          >
            <View style={styles.matchDate}>
              <Icon name="calendar" size={16} color={colors.primary} />
              <Text style={styles.matchDateText}>{formatDate(item.date)}</Text>
            </View>
            <Text style={styles.matchTime}>{item.time}</Text>
            <Text style={styles.matchLocation}>
              {item.venue || item.location || 'Saha'}
            </Text>
            {item.score != null && item.score !== '' && (
              <Text style={styles.matchScore}>{item.score}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  filterPillTextActive: {
    color: colors.secondary,
  },
  filterBadge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    borderRadius: borderRadius.full,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeInactive: {
    backgroundColor: colors.text.tertiary,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.primary,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  list: {
    padding: spacing.lg,
  },
  listEmpty: {
    flexGrow: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  empty: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  matchDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  matchDateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  matchTime: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  matchLocation: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  matchScore: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.sm,
  },
});
