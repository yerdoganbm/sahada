/**
 * Tournament Screen – Turnuva ve fikstür (Firestore)
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
import { getTournamentTeams, getBracketMatches } from '../services/tournament';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'Tournament'>;

const ROUND_LABELS: Record<string, string> = {
  quarter: 'Çeyrek Final',
  semi: 'Yarı Final',
  final: 'Final',
};

export default function TournamentScreen() {
  const navigation = useNavigation<NavProp>();
  const [teams, setTeams] = useState<Awaited<ReturnType<typeof getTournamentTeams>>>([]);
  const [brackets, setBrackets] = useState<Awaited<ReturnType<typeof getBracketMatches>>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const [tList, bList] = await Promise.all([getTournamentTeams(), getBracketMatches()]);
    setTeams(tList);
    setBrackets(bList);
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

  const sortedTeams = [...teams].sort((a, b) => (b.stats?.points ?? 0) - (a.stats?.points ?? 0));

  if (loading && teams.length === 0 && brackets.length === 0) {
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
        <Text style={styles.headerTitle}>Turnuva</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionTitle}>Puan Durumu</Text>
        {sortedTeams.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="trophy" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Takım bulunamadı</Text>
          </View>
        ) : (
          <View style={styles.table}>
            {sortedTeams.map((t, i) => (
              <View key={t.id} style={styles.row}>
                <Text style={styles.rank}>{i + 1}</Text>
                <Text style={styles.teamName}>{t.name}</Text>
                <Text style={styles.points}>{t.stats?.points ?? 0}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Fikstür</Text>
        {brackets.length === 0 ? (
          <Text style={styles.emptyText}>Maç bulunamadı</Text>
        ) : (
          brackets.map((b) => (
            <View key={b.id} style={styles.bracketCard}>
              <Text style={styles.roundLabel}>{ROUND_LABELS[b.round] || b.round}</Text>
              <View style={styles.matchRow}>
                <Text style={styles.teamText}>{b.team1?.name ?? '-'}</Text>
                <Text style={styles.vs}>vs</Text>
                <Text style={styles.teamText}>{b.team2?.name ?? '-'}</Text>
              </View>
              {b.score && <Text style={styles.score}>{b.score}</Text>}
              {b.date && <Text style={styles.dateText}>{b.date}</Text>}
            </View>
          ))
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
  sectionTitle: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.text.tertiary, marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingVertical: spacing.lg },
  emptyText: { color: colors.text.secondary },
  table: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  rank: { width: 24, fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.text.secondary },
  teamName: { flex: 1, fontSize: typography.fontSize.md, color: colors.text.primary, fontWeight: '500' },
  points: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.primary },
  bracketCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  roundLabel: { fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: '600', marginBottom: spacing.sm },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamText: { flex: 1, fontSize: typography.fontSize.md, color: colors.text.primary },
  vs: { marginHorizontal: spacing.md, fontSize: typography.fontSize.sm, color: colors.text.tertiary },
  score: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.primary, marginTop: spacing.sm, textAlign: 'center' },
  dateText: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: 4, textAlign: 'center' },
});
