/**
 * Lineup Manager Screen – Maç kadrosu (Firestore)
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
import { getMatches } from '../services/matches';
import { getTeamIdForUser } from '../services/players';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'LineupManager'>;

export default function LineupManagerScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Awaited<ReturnType<typeof getMatches>>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const teamId = user?.id ? await getTeamIdForUser(user.id) : undefined;
    const list = await getMatches(teamId ? { teamId } : undefined);
    const upcoming = list.filter((m) => m.status === 'upcoming' && m.date >= new Date().toISOString().slice(0, 10));
    setMatches(upcoming);
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

  if (loading && matches.length === 0) {
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
        <Text style={styles.headerTitle}>Kadro Yöneticisi</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {matches.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="format-list-checks" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Yaklaşan maç yok</Text>
            <Text style={styles.emptySub}>Maç oluşturduğunuzda kadro belirleyebilirsiniz.</Text>
          </View>
        ) : (
          matches.map((m) => {
            const yesCount = m.attendees?.filter((a) => a.status === 'YES').length ?? 0;
            const total = m.capacity ?? 14;
            return (
              <TouchableOpacity
                key={m.id}
                style={styles.card}
                onPress={() => navigation.navigate('MatchDetails', { matchId: m.id })}
              >
                <Text style={styles.dateText}>{m.date} • {m.time}</Text>
                <Text style={styles.venueText}>{m.venue || m.location}</Text>
                <View style={styles.progressRow}>
                  <View style={[styles.progressBar, { flex: 1 }]}>
                    <View style={[styles.progressFill, { width: `${(yesCount / total) * 100}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{yesCount}/{total}</Text>
                </View>
              </TouchableOpacity>
            );
          })
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
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { marginTop: spacing.md, color: colors.text.primary, fontWeight: '600' },
  emptySub: { marginTop: spacing.xs, color: colors.text.secondary, fontSize: typography.fontSize.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dateText: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text.primary },
  venueText: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  progressBar: { height: 8, backgroundColor: colors.background.secondary, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  progressText: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.primary },
});
