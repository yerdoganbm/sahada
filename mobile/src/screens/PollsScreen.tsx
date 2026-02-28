/**
 * Polls Screen – Anketler (Firestore)
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
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getPolls, votePoll } from '../services/polls';
import { getTeamIdForUser } from '../services/players';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import type { Poll } from '../types';

type NavProp = StackNavigationProp<RootStackParamList, 'Polls'>;

export default function PollsScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const teamId = user?.id ? await getTeamIdForUser(user.id) : undefined;
    const list = await getPolls(teamId);
    setPolls(list.map((p) => ({
      ...p,
      isVoted: !!user?.id && (p.voters?.includes(user.id) ?? false),
    })));
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

  const handleVote = async (poll: Poll, optionId: string) => {
    if (!user?.id || poll.isVoted) return;
    try {
      await votePoll(poll.id, optionId, user.id);
      await fetchData();
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Oy verilemedi');
    }
  };

  if (loading && polls.length === 0) {
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
        <Text style={styles.headerTitle}>Anketler</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {polls.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="poll" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Henüz anket yok</Text>
          </View>
        ) : (
          polls.map((poll) => {
            const total = poll.totalVotes || poll.options.reduce((s, o) => s + (o.votes || 0), 0);
            return (
              <View key={poll.id} style={styles.card}>
                <Text style={styles.question}>{poll.question}</Text>
                <Text style={styles.totalVotes}>{total} oy</Text>
                {poll.options.map((opt) => {
                  const pct = total > 0 ? Math.round(((opt.votes || 0) / total) * 100) : 0;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.optionRow, poll.isVoted && styles.optionRowVoted]}
                      onPress={() => handleVote(poll, opt.id)}
                      disabled={poll.isVoted}
                    >
                      <View style={[styles.optionBar, { width: `${pct}%` }]} />
                      <View style={styles.optionContent}>
                        <Text style={styles.optionText}>{opt.text}</Text>
                        <Text style={styles.optionPct}>{pct}%</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
  emptyText: { marginTop: spacing.md, color: colors.text.secondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  question: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
  totalVotes: { fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing.md },
  optionRow: {
    position: 'relative',
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  optionRowVoted: { opacity: 0.9 },
  optionBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: `${colors.primary}50`,
    borderRadius: borderRadius.md,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  optionText: { fontSize: typography.fontSize.md, color: colors.text.primary, fontWeight: '500' },
  optionPct: { fontSize: typography.fontSize.sm, color: colors.text.secondary, fontWeight: '600' },
});
