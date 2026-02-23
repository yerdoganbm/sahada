/**
 * MatchAnalysisScreen – Maç analizi, gol, istatistik, yorum
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { getMatch } from '../services/matches';
import { getPlayers } from '../services/players';
import { colors, spacing, borderRadius, typography } from '../theme';
import { hapticLight } from '../utils/haptic';
import { RootStackParamList } from '../types';
import type { Match, Player } from '../types';

type AnalysisRoute = RouteProp<RootStackParamList, 'MatchAnalysis'>;

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
interface GoalEvent {
  id: string;
  minute: number;
  scorerId: string;
  scorerName: string;
  assisterId?: string;
  assisterName?: string;
  type: 'normal' | 'penalty' | 'own_goal' | 'freekick';
}

interface MatchComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
  phase: 'pre' | 'post';
}

interface MatchStats {
  possession?: number;
  shots?: number;
  shotsOnTarget?: number;
  corners?: number;
  fouls?: number;
  yellowCards?: number;
  redCards?: number;
  passAccuracy?: number;
}

// ─────────────────────────────────────────
// Mini Bar chart
// ─────────────────────────────────────────
function StatBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <View style={statStyles.barBg}>
        <View style={[statStyles.barFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={statStyles.value}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  label: { fontSize: typography.fontSize.xs, color: colors.text.secondary, width: 95 },
  barBg: { flex: 1, height: 8, backgroundColor: colors.border.light, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  value: { fontSize: typography.fontSize.xs, fontWeight: '700', color: colors.text.primary, width: 30, textAlign: 'right' },
});

// ─────────────────────────────────────────
// Goal type labels
// ─────────────────────────────────────────
const GOAL_ICONS: Record<GoalEvent['type'], string> = {
  normal: '⚽',
  penalty: '🎯',
  own_goal: '😬',
  freekick: '🟡',
};

// ─────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────
export default function MatchAnalysisScreen() {
  const navigation = useNavigation();
  const route = useRoute<AnalysisRoute>();
  const { user } = useAuth();
  const matchId = route.params?.matchId;

  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'goals' | 'stats' | 'comments'>('goals');
  const [commentPhase, setCommentPhase] = useState<'pre' | 'post'>('post');
  const [comments, setComments] = useState<MatchComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [goals, setGoals] = useState<GoalEvent[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalMinute, setGoalMinute] = useState('');
  const [goalScorerId, setGoalScorerId] = useState('');
  const [goalType, setGoalType] = useState<GoalEvent['type']>('normal');
  const [stats, setStats] = useState<MatchStats>({
    possession: 55,
    shots: 12,
    shotsOnTarget: 6,
    corners: 4,
    fouls: 8,
    yellowCards: 1,
    redCards: 0,
    passAccuracy: 78,
  });

  // Load match data
  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getMatch(matchId),
      firestore().collection('match_goals').where('matchId', '==', matchId).orderBy('minute', 'asc').get().catch(() => null),
      firestore().collection('match_stats').doc(matchId).get().catch(() => null),
    ]).then(([m, goalsSnap, statsSnap]) => {
      if (cancelled) return;
      setMatch(m);
      if (goalsSnap) {
        const g = goalsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as GoalEvent));
        setGoals(g);
      }
      if (statsSnap?.exists) {
        setStats((prev) => ({ ...prev, ...(statsSnap.data() as MatchStats) }));
      }
      if (m?.teamId) {
        getPlayers({ teamId: m.teamId }).then((list) => {
          if (!cancelled) setPlayers(list);
        });
      }
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [matchId]);

  // Realtime comments
  useEffect(() => {
    if (!matchId) return;
    const unsub = firestore()
      .collection('match_comments')
      .where('matchId', '==', matchId)
      .where('phase', '==', commentPhase)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot((snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId as string,
            userName: data.userName as string,
            userAvatar: data.userAvatar as string | undefined,
            text: data.text as string,
            createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date(),
            phase: data.phase as 'pre' | 'post',
          };
        });
        setComments(list);
      }, () => {});
    return () => unsub();
  }, [matchId, commentPhase]);

  const handleSendComment = async () => {
    if (!commentText.trim() || !user?.id || !matchId) return;
    setSendingComment(true);
    try {
      await firestore().collection('match_comments').add({
        matchId,
        userId: user.id,
        userName: user.name || 'Oyuncu',
        userAvatar: user.avatar || null,
        text: commentText.trim(),
        phase: commentPhase,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      setCommentText('');
      hapticLight();
    } catch (e) {
      Alert.alert('Hata', 'Yorum gönderilemedi.');
    } finally {
      setSendingComment(false);
    }
  };

  const handleAddGoal = async () => {
    const minute = parseInt(goalMinute, 10);
    if (!minute || minute < 1 || minute > 120 || !goalScorerId) {
      Alert.alert('Hata', 'Dakika (1-120) ve gol atan oyuncu seçilmeli.');
      return;
    }
    const scorer = players.find((p) => p.id === goalScorerId);
    const newGoal: Omit<GoalEvent, 'id'> & { matchId: string } = {
      matchId: matchId!,
      minute,
      scorerId: goalScorerId,
      scorerName: scorer?.name || 'Bilinmiyor',
      type: goalType,
    };
    try {
      const ref = await firestore().collection('match_goals').add(newGoal);
      setGoals((prev) => [...prev, { ...newGoal, id: ref.id }].sort((a, b) => a.minute - b.minute));
      setShowAddGoal(false);
      setGoalMinute('');
      hapticLight();
    } catch {
      Alert.alert('Hata', 'Gol eklenemedi.');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Analiz yükleniyor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Maç Analizi</Text>
          {match && <Text style={styles.headerSub}>{formatDate(match.date)} • {match.time}</Text>}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Match Score Hero */}
      {match && (
        <View style={styles.scoreHero}>
          <View style={styles.teamSide}>
            <View style={styles.teamAvatar}>
              <Icon name="shield-half-full" size={28} color={colors.primary} />
            </View>
            <Text style={styles.teamName} numberOfLines={1}>{match.teamName || 'Takımımız'}</Text>
          </View>
          <View style={styles.scoreCenter}>
            {match.score ? (
              <Text style={styles.scoreLine}>{match.score}</Text>
            ) : (
              <Text style={styles.scoreLine}>- : -</Text>
            )}
            <View style={[styles.statusBadge, match.status === 'completed' && styles.statusCompleted]}>
              <Text style={styles.statusText}>{match.status === 'completed' ? 'Tamamlandı' : match.status === 'upcoming' ? 'Yaklaşan' : 'İptal'}</Text>
            </View>
          </View>
          <View style={styles.teamSide}>
            <View style={[styles.teamAvatar, { backgroundColor: `${colors.error}20` }]}>
              <Icon name="shield-half-full" size={28} color={colors.error} />
            </View>
            <Text style={styles.teamName} numberOfLines={1}>{match.opponent || 'Rakip'}</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['goals', 'stats', 'comments'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Icon
              name={tab === 'goals' ? 'soccer' : tab === 'stats' ? 'chart-bar' : 'comment-multiple'}
              size={16}
              color={activeTab === tab ? colors.primary : colors.text.secondary}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'goals' ? 'Goller' : tab === 'stats' ? 'İstatistik' : 'Yorumlar'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} keyboardShouldPersistTaps="handled">
        {/* ────── GOALS TAB ────── */}
        {activeTab === 'goals' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>GOL ZAMAN ÇİZELGESİ</Text>
              {user?.teamId && (
                <TouchableOpacity onPress={() => setShowAddGoal(!showAddGoal)} style={styles.addGoalBtn}>
                  <Icon name={showAddGoal ? 'close' : 'plus'} size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {showAddGoal && (
              <View style={styles.addGoalForm}>
                <Text style={styles.addGoalTitle}>Gol Ekle</Text>
                <View style={styles.addGoalRow}>
                  <TextInput
                    style={[styles.addInput, { width: 80 }]}
                    value={goalMinute}
                    onChangeText={setGoalMinute}
                    placeholder="Dk."
                    placeholderTextColor={colors.text.disabled}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    {players.map((p) => (
                      <TouchableOpacity key={p.id} style={[styles.playerChip, goalScorerId === p.id && styles.playerChipActive]} onPress={() => setGoalScorerId(p.id)}>
                        <Text style={[styles.playerChipText, goalScorerId === p.id && { color: colors.primary }]}>{p.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.goalTypeRow}>
                  {(['normal', 'penalty', 'freekick', 'own_goal'] as const).map((t) => (
                    <TouchableOpacity key={t} style={[styles.goalTypeChip, goalType === t && styles.goalTypeActive]} onPress={() => setGoalType(t)}>
                      <Text style={styles.goalTypeText}>{GOAL_ICONS[t]} {t === 'normal' ? 'Normal' : t === 'penalty' ? 'Penaltı' : t === 'freekick' ? 'FK' : 'K.Kale'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.addGoalSubmit} onPress={handleAddGoal}>
                  <Text style={styles.addGoalSubmitText}>Gol Kaydet</Text>
                </TouchableOpacity>
              </View>
            )}

            {goals.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>⚽</Text>
                <Text style={styles.emptyText}>Henüz gol kaydedilmedi</Text>
              </View>
            ) : (
              <View style={styles.timeline}>
                {goals.map((g, i) => (
                  <View key={g.id} style={styles.timelineItem}>
                    <View style={styles.timelineBadge}>
                      <Text style={styles.timelineMin}>{g.minute}'</Text>
                    </View>
                    <View style={styles.timelineConnector} />
                    <View style={styles.goalCard}>
                      <Text style={styles.goalIcon}>{GOAL_ICONS[g.type]}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.goalScorer}>{g.scorerName}</Text>
                        {g.assisterName && <Text style={styles.goalAssist}>Asist: {g.assisterName}</Text>}
                        <Text style={styles.goalType}>{g.type === 'penalty' ? 'Penaltı' : g.type === 'freekick' ? 'Serbest Vuruş' : g.type === 'own_goal' ? 'Kendi Kalesi' : 'Normal Gol'}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ────── STATS TAB ────── */}
        {activeTab === 'stats' && (
          <>
            <Text style={styles.sectionTitle}>TAKIM İSTATİSTİKLERİ</Text>
            <View style={styles.statsCard}>
              {/* Possession Ring */}
              <View style={styles.possessionWrap}>
                <View style={styles.possessionRing}>
                  <Text style={styles.possessionValue}>{stats.possession ?? 50}%</Text>
                  <Text style={styles.possessionLabel}>Top Sahipliği</Text>
                </View>
              </View>

              <StatBar label="Şutlar" value={stats.shots ?? 0} maxValue={30} color={colors.primary} />
              <StatBar label="İsabetli Şut" value={stats.shotsOnTarget ?? 0} maxValue={stats.shots ?? 1} color={colors.success} />
              <StatBar label="Korner" value={stats.corners ?? 0} maxValue={15} color="#8B5CF6" />
              <StatBar label="Faul" value={stats.fouls ?? 0} maxValue={20} color={colors.warning} />
              <StatBar label="Pas İsabeti %" value={stats.passAccuracy ?? 0} maxValue={100} color="#14B8A6" />
            </View>

            <View style={styles.cardsRow}>
              <View style={styles.cardBadge}>
                <View style={[styles.cardRect, { backgroundColor: '#FCD34D' }]} />
                <Text style={styles.cardBadgeNum}>{stats.yellowCards ?? 0}</Text>
                <Text style={styles.cardBadgeLabel}>Sarı Kart</Text>
              </View>
              <View style={styles.cardBadge}>
                <View style={[styles.cardRect, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.cardBadgeNum}>{stats.redCards ?? 0}</Text>
                <Text style={styles.cardBadgeLabel}>Kırmızı Kart</Text>
              </View>
            </View>

            {/* Player Ratings */}
            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>OYUNCU DEĞERLENDİRMESİ</Text>
            {players.slice(0, 11).map((p) => {
              const rating = p.rating ?? Math.floor(Math.random() * 3) + 6;
              return (
                <View key={p.id} style={styles.playerRatingRow}>
                  <Image source={{ uri: p.avatar || `https://i.pravatar.cc/150?u=${p.id}` }} style={styles.playerRatingAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerRatingName}>{p.name}</Text>
                    <Text style={styles.playerRatingPos}>{p.position}</Text>
                  </View>
                  <View style={[styles.ratingBadge, { backgroundColor: rating >= 8 ? colors.success : rating >= 6 ? colors.warning : colors.error }]}>
                    <Text style={styles.ratingBadgeText}>{rating.toFixed(1)}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* ────── COMMENTS TAB ────── */}
        {activeTab === 'comments' && (
          <>
            <View style={styles.phaseRow}>
              <TouchableOpacity style={[styles.phaseBtn, commentPhase === 'pre' && styles.phaseActive]} onPress={() => setCommentPhase('pre')}>
                <Icon name="clock-start" size={14} color={commentPhase === 'pre' ? colors.primary : colors.text.secondary} />
                <Text style={[styles.phaseBtnText, commentPhase === 'pre' && styles.phaseActiveText]}>Maç Öncesi</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.phaseBtn, commentPhase === 'post' && styles.phaseActive]} onPress={() => setCommentPhase('post')}>
                <Icon name="flag-checkered" size={14} color={commentPhase === 'post' ? colors.primary : colors.text.secondary} />
                <Text style={[styles.phaseBtnText, commentPhase === 'post' && styles.phaseActiveText]}>Maç Sonu</Text>
              </TouchableOpacity>
            </View>

            {comments.length === 0 ? (
              <View style={styles.empty}>
                <Icon name="comment-outline" size={48} color={colors.text.disabled} />
                <Text style={styles.emptyText}>Henüz yorum yok</Text>
                <Text style={styles.emptySub}>İlk yorumu sen yap!</Text>
              </View>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={[styles.commentCard, c.userId === user?.id && styles.commentCardMine]}>
                  <Image
                    source={{ uri: c.userAvatar || `https://i.pravatar.cc/150?u=${c.userId}` }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentName}>{c.userName}</Text>
                      <Text style={styles.commentTime}>
                        {c.createdAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Comment Input */}
      {activeTab === 'comments' && (
        <View style={styles.commentInputBar}>
          <TextInput
            style={styles.commentInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder={`${commentPhase === 'pre' ? 'Maç öncesi' : 'Maç sonu'} yorumun...`}
            placeholderTextColor={colors.text.disabled}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[styles.commentSendBtn, (!commentText.trim() || sendingComment) && styles.commentSendBtnDisabled]}
            onPress={handleSendComment}
            disabled={!commentText.trim() || sendingComment}
          >
            {sendingComment ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.text.secondary },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary },
  headerSub: { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  // Score Hero
  scoreHero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.lg, marginBottom: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border.light },
  teamSide: { flex: 1, alignItems: 'center', gap: spacing.sm },
  teamAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${colors.primary}18`, justifyContent: 'center', alignItems: 'center' },
  teamName: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.text.secondary, textAlign: 'center' },
  scoreCenter: { alignItems: 'center', paddingHorizontal: spacing.md },
  scoreLine: { fontSize: 32, fontWeight: '800', color: colors.text.primary },
  statusBadge: { backgroundColor: colors.warning, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, marginTop: 4 },
  statusCompleted: { backgroundColor: `${colors.success}30` },
  statusText: { fontSize: 9, fontWeight: '700', color: colors.text.primary },
  // Tabs
  tabRow: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border.light },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: spacing.md },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.text.secondary },
  tabTextActive: { color: colors.primary },
  content: { flex: 1 },
  contentInner: { padding: spacing.lg, paddingBottom: 100 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: colors.text.tertiary, letterSpacing: 1.5, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.fontSize.md, color: colors.text.secondary, marginTop: spacing.sm },
  emptySub: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: 4 },
  // Goals
  addGoalBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${colors.primary}18`, justifyContent: 'center', alignItems: 'center' },
  addGoalForm: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border.light },
  addGoalTitle: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.md },
  addGoalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  addInput: { backgroundColor: colors.background.primary, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: typography.fontSize.sm, color: colors.text.primary, borderWidth: 1, borderColor: colors.border.light },
  playerChip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.md, backgroundColor: colors.background.secondary, marginRight: 6 },
  playerChipActive: { backgroundColor: `${colors.primary}18`, borderWidth: 1, borderColor: colors.primary },
  playerChipText: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  goalTypeRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.md },
  goalTypeChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm, backgroundColor: colors.background.secondary },
  goalTypeActive: { backgroundColor: `${colors.primary}18`, borderWidth: 1, borderColor: colors.primary },
  goalTypeText: { fontSize: 10, color: colors.text.secondary },
  addGoalSubmit: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: spacing.sm, alignItems: 'center' },
  addGoalSubmitText: { fontSize: typography.fontSize.sm, fontWeight: '700', color: '#fff' },
  // Timeline
  timeline: { paddingLeft: spacing.sm },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  timelineBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${colors.primary}20`, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  timelineMin: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.primary },
  timelineConnector: {},
  goalCard: { flex: 1, flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border.light, gap: spacing.sm, alignItems: 'flex-start' },
  goalIcon: { fontSize: 22 },
  goalScorer: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary },
  goalAssist: { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  goalType: { fontSize: 10, color: colors.text.tertiary, marginTop: 2 },
  // Stats
  statsCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border.light },
  possessionWrap: { alignItems: 'center', marginBottom: spacing.lg },
  possessionRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 6, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  possessionValue: { fontSize: typography.fontSize.xl, fontWeight: '800', color: colors.text.primary },
  possessionLabel: { fontSize: 9, color: colors.text.secondary, fontWeight: '600' },
  cardsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  cardBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.border.light },
  cardRect: { width: 16, height: 22, borderRadius: 2 },
  cardBadgeNum: { fontSize: typography.fontSize.xl, fontWeight: '800', color: colors.text.primary },
  cardBadgeLabel: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  playerRatingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: 6, borderWidth: 1, borderColor: colors.border.light, gap: spacing.md },
  playerRatingAvatar: { width: 36, height: 36, borderRadius: 18 },
  playerRatingName: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.text.primary },
  playerRatingPos: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  ratingBadge: { width: 38, height: 38, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  ratingBadgeText: { fontSize: typography.fontSize.sm, fontWeight: '800', color: '#fff' },
  // Comments
  phaseRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  phaseBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border.light },
  phaseActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
  phaseBtnText: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text.secondary },
  phaseActiveText: { color: colors.primary },
  commentCard: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md, gap: spacing.sm },
  commentCardMine: { flexDirection: 'row-reverse' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentBody: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border.light },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentName: { fontSize: typography.fontSize.xs, fontWeight: '700', color: colors.primary },
  commentTime: { fontSize: 10, color: colors.text.tertiary },
  commentText: { fontSize: typography.fontSize.sm, color: colors.text.primary, lineHeight: 20 },
  commentInputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.light, backgroundColor: colors.background.primary, gap: spacing.sm },
  commentInput: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, fontSize: typography.fontSize.sm, color: colors.text.primary, maxHeight: 100, borderWidth: 1, borderColor: colors.border.light },
  commentSendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  commentSendBtnDisabled: { opacity: 0.5 },
});
