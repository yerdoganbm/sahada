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
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { canCreateMatch } from '../utils/permissions';
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
  const { user } = useAuth();
  const canCreate = canCreateMatch(user);
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
        {canCreate && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('MatchCreate')}
          >
            <Icon name="plus" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>Maç Oluştur</Text>
          </TouchableOpacity>
        )}
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
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Yeniden dene</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const yesCount =
            typeof item.goingCount === 'number'
              ? item.goingCount
              : item.attendees?.filter((a) => a.status === 'YES').length ?? 0;
          const total = item.capacity ?? 14;
          const myRsvp = item.attendees?.find((a) => a.playerId === user?.id);
          const isUpcomingMatch = isUpcoming(item);
          return (
            <TouchableOpacity
              style={[styles.matchCard, isUpcomingMatch && styles.matchCardUpcoming]}
              onPress={() => navigation.navigate('MatchDetails', { matchId: item.id })}
              activeOpacity={0.8}
            >
              <View style={styles.matchCardHeader}>
                <View style={styles.matchDate}>
                  <Icon name="calendar" size={14} color={colors.primary} />
                  <Text style={styles.matchDateText}>{formatDate(item.date)}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  item.status === 'completed' ? styles.statusCompleted
                    : item.status === 'cancelled' ? styles.statusCancelled
                    : styles.statusUpcoming
                ]}>
                  <Text style={styles.statusText}>
                    {item.status === 'completed' ? 'Tamamlandı'
                      : item.status === 'cancelled' ? 'İptal'
                      : 'Yaklaşan'}
                  </Text>
                </View>
              </View>
              <Text style={styles.matchTime}>{item.time}</Text>
              <View style={styles.matchLocationRow}>
                <Icon name="map-marker" size={14} color={colors.text.tertiary} />
                <Text style={styles.matchLocation}>
                  {item.venue || item.location || 'Saha'}
                </Text>
              </View>
              {item.score != null && item.score !== '' && (
                <Text style={styles.matchScore}>{item.score}</Text>
              )}
              {isUpcomingMatch && (
                <View style={styles.matchCardFooter}>
                  <View style={styles.attendeeRow}>
                    <Icon name="account-group" size={14} color={colors.text.tertiary} />
                    <Text style={styles.attendeeText}>{yesCount}/{total} katılımcı</Text>
                  </View>
                  {myRsvp && (
                    <View style={[styles.myRsvpBadge,
                      myRsvp.status === 'YES' ? styles.rsvpYes
                        : myRsvp.status === 'NO' ? styles.rsvpNo
                        : styles.rsvpMaybe
                    ]}>
                      <Text style={styles.myRsvpText}>
                        {myRsvp.status === 'YES' ? '✓ Geliyorum'
                          : myRsvp.status === 'NO' ? '✗ Gelmiyorum'
                          : '? Belki'}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.sm,
  },
  addButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginLeft: spacing.xs,
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
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.secondary,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  matchCardUpcoming: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  matchDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchDateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusUpcoming: { backgroundColor: `${colors.primary}20` },
  statusCompleted: { backgroundColor: 'rgba(100,116,139,0.2)' },
  statusCancelled: { backgroundColor: 'rgba(239,68,68,0.15)' },
  statusText: { fontSize: 10, fontWeight: '700', color: colors.text.secondary },
  matchTime: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  matchLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  matchLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  matchScore: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  matchCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attendeeText: { fontSize: typography.fontSize.xs, color: colors.text.tertiary },
  myRsvpBadge: { borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 3 },
  rsvpYes: { backgroundColor: `${colors.success}20` },
  rsvpNo: { backgroundColor: 'rgba(239,68,68,0.15)' },
  rsvpMaybe: { backgroundColor: 'rgba(245,158,11,0.15)' },
  myRsvpText: { fontSize: 10, fontWeight: '700', color: colors.text.secondary },
});
