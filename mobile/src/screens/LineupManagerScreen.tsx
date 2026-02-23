/**
 * LineupManagerScreen – Kadro dizilişi ve yönetimi
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
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getMatches } from '../services/matches';
import { getPlayers, getTeamIdForUser } from '../services/players';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import type { Player, Match } from '../types';

type NavProp = StackNavigationProp<RootStackParamList, 'LineupManager'>;

const { width: SW } = Dimensions.get('window');
const FIELD_H = SW * 1.3;
const FIELD_W = SW - spacing.lg * 2;

type Formation = '4-3-3' | '4-4-2' | '3-5-2' | '5-3-2' | '4-2-3-1';

const FORMATIONS: Record<Formation, { rows: number[]; label: string }> = {
  '4-3-3': { rows: [3, 3, 4, 1], label: '4-3-3 Klasik' },
  '4-4-2': { rows: [2, 4, 4, 1], label: '4-4-2' },
  '3-5-2': { rows: [2, 5, 3, 1], label: '3-5-2' },
  '5-3-2': { rows: [2, 3, 5, 1], label: '5-3-2' },
  '4-2-3-1': { rows: [1, 3, 2, 4, 1], label: '4-2-3-1' },
};

interface SlotPlayer extends Player {
  slotIndex: number;
}

export default function LineupManagerScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [lineup, setLineup] = useState<(Player | null)[]>(Array(11).fill(null));
  const [tab, setTab] = useState<'formation' | 'list'>('formation');

  const fetchData = useCallback(async () => {
    const teamId = user?.teamId || (user?.id ? await getTeamIdForUser(user.id) : undefined);
    const [matchList, playerList] = await Promise.all([
      getMatches(teamId ? { teamId } : undefined),
      getPlayers(teamId ? { teamId } : undefined),
    ]);
    const upcoming = matchList.filter(
      (m) => m.status === 'upcoming' && m.date >= new Date().toISOString().slice(0, 10)
    );
    setMatches(upcoming);
    setPlayers(playerList);
    if (upcoming.length > 0 && !selectedMatch) setSelectedMatch(upcoming[0]);
  }, [user?.teamId, user?.id]);

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

  const fillFromAttendees = () => {
    if (!selectedMatch) return;
    const yes = players.filter((p) =>
      selectedMatch.attendees?.find((a) => a.playerId === p.id && a.status === 'YES')
    );
    const newLineup: (Player | null)[] = Array(11).fill(null);
    yes.slice(0, 11).forEach((p, i) => { newLineup[i] = p; });
    setLineup(newLineup);
  };

  const fillAuto = () => {
    const sorted = [...players].sort((a, b) => b.rating - a.rating);
    const newLineup: (Player | null)[] = Array(11).fill(null);
    sorted.slice(0, 11).forEach((p, i) => { newLineup[i] = p; });
    setLineup(newLineup);
    Alert.alert('Otomatik Diziliş', 'En yüksek ratingli 11 oyuncu seçildi!');
  };

  const handleSlotPress = (slotIdx: number) => {
    const bench = players.filter((p) => !lineup.some((l) => l?.id === p.id));
    if (lineup[slotIdx]) {
      const newL = [...lineup];
      newL[slotIdx] = null;
      setLineup(newL);
      return;
    }
    if (bench.length === 0) {
      Alert.alert('Tüm oyuncular sahadaki yerlerine alındı.');
      return;
    }
    // Auto fill from bench sorted by rating
    const pick = bench.sort((a, b) => b.rating - a.rating)[0];
    const newL = [...lineup];
    newL[slotIdx] = pick;
    setLineup(newL);
  };

  const rows = FORMATIONS[formation].rows;

  // Build slot positions from rows
  const slots: number[][] = [];
  let slotCounter = 0;
  for (const cnt of rows) {
    const row: number[] = [];
    for (let i = 0; i < cnt; i++) {
      row.push(slotCounter++);
    }
    slots.push(row);
  }

  const benched = players.filter((p) => !lineup.some((l) => l?.id === p.id));

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
        <Text style={styles.headerTitle}>Kadro Dizilişi</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('SquadShareWizard')}>
          <Icon name="share-variant" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Match Selector */}
      {matches.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchSelector} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          {matches.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.matchChip, selectedMatch?.id === m.id && styles.matchChipActive]}
              onPress={() => setSelectedMatch(m)}
            >
              <Text style={[styles.matchChipText, selectedMatch?.id === m.id && styles.matchChipTextActive]}>
                {m.date} {m.time}
              </Text>
              <Text style={[styles.matchChipVenue, selectedMatch?.id === m.id && { color: 'rgba(255,255,255,0.7)' }]} numberOfLines={1}>
                {m.venue || m.location}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'formation' && styles.tabBtnActive]}
          onPress={() => setTab('formation')}
        >
          <Icon name="strategy" size={16} color={tab === 'formation' ? colors.primary : colors.text.secondary} />
          <Text style={[styles.tabText, tab === 'formation' && styles.tabTextActive]}>Diziliş</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'list' && styles.tabBtnActive]}
          onPress={() => setTab('list')}
        >
          <Icon name="format-list-bulleted" size={16} color={tab === 'list' ? colors.primary : colors.text.secondary} />
          <Text style={[styles.tabText, tab === 'list' && styles.tabTextActive]}>Liste</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {matches.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="strategy" size={56} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Yaklaşan maç yok</Text>
            <Text style={styles.emptySub}>Maç oluşturup kadro belirleyebilirsiniz.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('MatchCreate')}>
              <Text style={styles.emptyBtnText}>Maç Oluştur</Text>
            </TouchableOpacity>
          </View>
        ) : tab === 'formation' ? (
          <>
            {/* Formation Selector */}
            <View style={styles.formationSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(Object.keys(FORMATIONS) as Formation[]).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.formationChip, formation === f && styles.formationChipActive]}
                    onPress={() => setFormation(f)}
                  >
                    <Text style={[styles.formationChipText, formation === f && styles.formationChipTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={fillFromAttendees}>
                <Icon name="calendar-check" size={14} color={colors.primary} />
                <Text style={styles.actionBtnText}>Katılanlardan Doldur</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={fillAuto}>
                <Icon name="auto-fix" size={14} color={colors.primary} />
                <Text style={styles.actionBtnText}>Otomatik</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setLineup(Array(11).fill(null))}>
                <Icon name="refresh" size={14} color={colors.error} />
                <Text style={[styles.actionBtnText, { color: colors.error }]}>Sıfırla</Text>
              </TouchableOpacity>
            </View>

            {/* Football Field */}
            <View style={styles.field}>
              {/* Field markings */}
              <View style={styles.centerCircle} />
              <View style={styles.centerLine} />
              <View style={styles.goalTop} />
              <View style={styles.goalBottom} />
              <View style={styles.penaltyTop} />
              <View style={styles.penaltyBottom} />

              {/* Player slots arranged in rows */}
              <View style={styles.fieldSlots}>
                {slots.map((row, rowIdx) => (
                  <View key={rowIdx} style={styles.fieldRow}>
                    {row.map((slotIdx) => {
                      const p = lineup[slotIdx];
                      return (
                        <TouchableOpacity
                          key={slotIdx}
                          style={styles.playerSlot}
                          onPress={() => handleSlotPress(slotIdx)}
                        >
                          {p ? (
                            <>
                              <Image
                                source={{ uri: p.avatar || `https://i.pravatar.cc/150?u=${p.id}` }}
                                style={styles.slotAvatar}
                              />
                              <Text style={styles.slotName} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
                              <View style={styles.slotRating}>
                                <Text style={styles.slotRatingText}>{p.rating}</Text>
                              </View>
                            </>
                          ) : (
                            <>
                              <View style={styles.slotEmpty}>
                                <Icon name="plus" size={16} color="rgba(255,255,255,0.5)" />
                              </View>
                              <Text style={styles.slotEmptyText}>Boş</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            {/* Bench */}
            {benched.length > 0 && (
              <View style={styles.benchSection}>
                <Text style={styles.benchTitle}>YEDEK ({benched.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {benched.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.benchCard}
                      onPress={() => {
                        const emptyIdx = lineup.findIndex((l) => l === null);
                        if (emptyIdx < 0) {
                          Alert.alert('Diziliş dolu', '11 oyuncu zaten seçili. Birini çıkarmak için sahadaki oyuncuya dokunun.');
                          return;
                        }
                        const newL = [...lineup];
                        newL[emptyIdx] = p;
                        setLineup(newL);
                      }}
                    >
                      <Image source={{ uri: p.avatar || `https://i.pravatar.cc/150?u=${p.id}` }} style={styles.benchAvatar} />
                      <Text style={styles.benchName} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
                      <Text style={styles.benchPos}>{p.position}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        ) : (
          /* List View */
          <View>
            {matches.map((m) => {
              const yesCount = m.attendees?.filter((a) => a.status === 'YES').length ?? 0;
              const total = m.capacity ?? 14;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={styles.card}
                  onPress={() => navigation.navigate('MatchDetails', { matchId: m.id })}
                >
                  <View style={styles.cardTop}>
                    <Icon name="soccer" size={18} color={colors.primary} />
                    <Text style={styles.dateText}>{m.date} • {m.time}</Text>
                  </View>
                  <Text style={styles.venueText}>{m.venue || m.location}</Text>
                  <View style={styles.progressRow}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${Math.min((yesCount / total) * 100, 100)}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{yesCount}/{total} Hazır</Text>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardFooterText}>Detayları görüntüle →</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    justifyContent: 'space-between',
  },
  backBtn: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  matchSelector: { marginBottom: spacing.sm },
  matchChip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    minWidth: 130,
  },
  matchChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  matchChipText: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.text.primary },
  matchChipTextActive: { color: '#fff' },
  matchChipVenue: { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  tabBar: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.sm, gap: spacing.sm },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border.light },
  tabBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
  tabText: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text.secondary },
  tabTextActive: { color: colors.primary },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { marginTop: spacing.md, color: colors.text.primary, fontWeight: '600', fontSize: typography.fontSize.md },
  emptySub: { marginTop: spacing.xs, color: colors.text.secondary, fontSize: typography.fontSize.sm },
  emptyBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  formationSelector: { marginBottom: spacing.md },
  formationChip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border.light, marginRight: spacing.sm },
  formationChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  formationChipText: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.text.secondary },
  formationChipTextActive: { color: '#fff' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border.light },
  actionBtnText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  // Football Field
  field: {
    width: FIELD_W,
    height: FIELD_H,
    backgroundColor: '#2d5a27',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: spacing.lg,
  },
  centerCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
  },
  centerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  goalTop: {
    position: 'absolute',
    top: 0,
    left: '30%',
    right: '30%',
    height: 24,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  goalBottom: {
    position: 'absolute',
    bottom: 0,
    left: '30%',
    right: '30%',
    height: 24,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  penaltyTop: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: FIELD_H * 0.15,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  penaltyBottom: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: FIELD_H * 0.15,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  fieldSlots: {
    flex: 1,
    paddingVertical: 16,
    justifyContent: 'space-around',
  },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  playerSlot: { alignItems: 'center', width: 60 },
  slotAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#fff' },
  slotName: { fontSize: 10, color: '#fff', fontWeight: '700', marginTop: 3, textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  slotRating: { position: 'absolute', top: 0, right: 0, backgroundColor: colors.primary, borderRadius: 8, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  slotRatingText: { fontSize: 9, color: '#fff', fontWeight: '800' },
  slotEmpty: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  slotEmptyText: { fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  // Bench
  benchSection: { marginBottom: spacing.xl },
  benchTitle: { fontSize: typography.fontSize.xs, fontWeight: '700', color: colors.text.tertiary, letterSpacing: 1.5, marginBottom: spacing.md },
  benchCard: { alignItems: 'center', marginRight: spacing.md, width: 60 },
  benchAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.border.medium },
  benchName: { fontSize: 10, color: colors.text.primary, fontWeight: '600', marginTop: 4 },
  benchPos: { fontSize: 9, color: colors.text.tertiary },
  // List View
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  dateText: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text.primary },
  venueText: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: spacing.md },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressBar: { flex: 1, height: 8, backgroundColor: colors.background.secondary, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  progressText: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.primary, minWidth: 80 },
  cardFooter: { marginTop: spacing.sm, alignItems: 'flex-end' },
  cardFooterText: { fontSize: typography.fontSize.xs, color: colors.text.tertiary },
});
