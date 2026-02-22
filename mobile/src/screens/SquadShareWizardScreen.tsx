/**
 * Squad Share Wizard – Kadro paylaşım sihirbazı (Firestore)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getMatches } from '../services/matches';
import { getPlayers, getTeamIdForUser } from '../services/players';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { hapticLight } from '../utils/haptic';

type NavProp = StackNavigationProp<RootStackParamList, 'SquadShareWizard'>;

export default function SquadShareWizardScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Awaited<ReturnType<typeof getMatches>>>([]);
  const [players, setPlayers] = useState<Awaited<ReturnType<typeof getPlayers>>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const teamId = user?.id ? await getTeamIdForUser(user.id) : undefined;
    const [mList, pList] = await Promise.all([
      getMatches(teamId ? { teamId } : undefined),
      getPlayers(teamId ? { teamId } : undefined),
    ]);
    const upcoming = mList.filter((m) => m.status === 'upcoming' && m.date >= new Date().toISOString().slice(0, 10));
    setMatches(upcoming);
    setPlayers(pList);
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

  const handleShareSquad = (match: (typeof matches)[0]) => {
    hapticLight();
    const playerNames = players.slice(0, 14).map((p, i) => `${i + 1}. ${p.name} (${p.position})`).join('\n');
    const msg = `${match.date} ${match.time} - ${match.venue || match.location}\n\nKadro:\n${playerNames}\n\nSahada ile takip et.`;
    Share.share({ message: msg, title: 'Maç Kadrosu' });
  };

  const handleShareFullRoster = () => {
    hapticLight();
    const roster = players.map((p, i) => `${i + 1}. ${p.name} - ${p.position}`).join('\n');
    Share.share({ message: `Takım Kadrosu:\n\n${roster}\n\nSahada`, title: 'Takım Kadrosu' });
  };

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
        <Text style={styles.headerTitle}>Kadro Paylaşım</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionTitle}>Maç Kadrosu Paylaş</Text>
        {matches.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Yaklaşan maç yok</Text>
          </View>
        ) : (
          matches.map((m) => (
            <View key={m.id} style={styles.card}>
              <Text style={styles.cardTitle}>{m.date} • {m.time}</Text>
              <Text style={styles.cardVenue}>{m.venue || m.location}</Text>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={() => handleShareSquad(m)}
              >
                <Icon name="share-variant" size={20} color={colors.secondary} />
                <Text style={styles.shareBtnText}>Kadroyu Paylaş</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Tüm Kadro</Text>
        <TouchableOpacity style={styles.fullRosterBtn} onPress={handleShareFullRoster}>
          <Icon name="account-group" size={24} color={colors.primary} />
          <Text style={styles.fullRosterText}>Tüm Kadroyu Paylaş ({players.length} kişi)</Text>
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
  sectionTitle: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.text.tertiary, marginBottom: spacing.md },
  empty: { padding: spacing.lg },
  emptyText: { color: colors.text.secondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardTitle: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary },
  cardVenue: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: 4 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  shareBtnText: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.primary },
  fullRosterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.md,
  },
  fullRosterText: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text.primary },
});
