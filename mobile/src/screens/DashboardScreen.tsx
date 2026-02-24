/**
 * Dashboard Screen - Ana ekran
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
  Share,
  Dimensions,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { getMatches } from '../services/matches';
import { hapticLight } from '../utils/haptic';
import { canAccessAdminPanel, canCreateMatch, canManageMembers } from '../utils/permissions';
import type { Match } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');
const ITEM_W = (SCREEN_W - spacing.lg * 2 - spacing.md * 3) / 4;

type DashboardNavigationProp = StackNavigationProp<RootStackParamList>;

function formatMatchDay(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'BUGÜN';
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return 'YARIN';
  return d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
}

interface QuickAction {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  show?: boolean;
}

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  const fetchUpcoming = useCallback(async () => {
    try {
      const list = await getMatches({ upcoming: true });
      setUpcomingMatches(list);
    } catch {
      setUpcomingMatches([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingMatches(true);
    fetchUpcoming().finally(() => { if (!cancelled) setLoadingMatches(false); });
    return () => { cancelled = true; };
  }, [fetchUpcoming]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUpcoming();
    setRefreshing(false);
  }, [fetchUpcoming]);

  const isAdmin = canAccessAdminPanel(user);
  const isCaptain = user?.isCaptain;
  const canManage = canManageMembers(user);
  const canCreate = canCreateMatch(user);
  const hasTeam = !!user?.teamId;

  const quickActions: QuickAction[] = [
    { icon: 'shield-account', label: 'Yönetim', color: '#6366F1', onPress: () => navigation.navigate('Admin'), show: isAdmin },
    { icon: 'account-plus', label: 'Üyeler', color: '#3B82F6', onPress: () => navigation.navigate('MemberManagement'), show: canManage },
    { icon: 'plus-circle', label: 'Maç Oluştur', color: '#EC4899', onPress: () => navigation.navigate('MatchCreate'), show: canCreate },
    { icon: 'forum', label: 'Takım Chat', color: '#10B981', onPress: () => navigation.navigate('TeamChat'), show: hasTeam },
    { icon: 'account-group', label: 'Kadro', color: '#06B6D4', onPress: () => navigation.dispatch(CommonActions.navigate('MainTabs', { screen: 'Team' })), show: true },
    { icon: 'strategy', label: 'Diziliş', color: '#A855F7', onPress: () => navigation.navigate('LineupManager'), show: true },
    { icon: 'map-marker', label: 'Sahalar', color: '#14B8A6', onPress: () => navigation.navigate('VenueList'), show: true },
    { icon: 'poll', label: 'Anketler', color: '#F59E0B', onPress: () => navigation.navigate('Polls'), show: true },
    { icon: 'trophy', label: 'Sıralama', color: '#8B5CF6', onPress: () => navigation.navigate('Leaderboard'), show: true },
    { icon: 'medal', label: 'Turnuva', color: '#EAB308', onPress: () => navigation.navigate('Tournament'), show: true },
    { icon: 'calendar-month', label: 'Takvim', color: '#0EA5E9', onPress: () => navigation.navigate('VenueCalendar'), show: true },
    { icon: 'crown', label: 'Abonelik', color: '#F97316', onPress: () => navigation.navigate('Subscription'), show: true },
    { icon: 'chart-bar', label: 'Finans', color: '#A855F7', onPress: () => navigation.navigate('FinancialReports'), show: isAdmin || canManage },
    { icon: 'account-cog', label: 'Üye Yönetimi', color: '#0EA5E9', onPress: () => navigation.navigate('MemberManagement'), show: isAdmin || canManage },
  ];

  const visibleActions = quickActions.filter((a) => a.show !== false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
          activeOpacity={0.8}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?u=guest' }}
              style={styles.avatar}
            />
            <View style={styles.statusIndicator} />
          </View>
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{user?.name ?? 'Hoşgeldin!'}</Text>
          <View style={styles.tierBadge}>
            {(isAdmin || isCaptain) && <Text style={styles.captainIcon}>⚽ </Text>}
            <Text style={styles.tierText}>
              {isAdmin ? 'YÖNETİCİ' :
               user?.tier === 'partner' ? 'SAHA PARTNER' :
               user?.tier === 'premium' ? 'PRO BALLER' :
               isCaptain ? 'KAPTAN' :
               hasTeam ? 'STARTER ÜYE' : 'MISAFIR'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Settings')}>
            <Icon name="cog" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
            <Icon name="bell" size={20} color={colors.text.secondary} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* No Team Banner */}
        {!hasTeam && (
          <View style={styles.noTeamBanner}>
            <Icon name="account-group-outline" size={24} color={colors.warning} />
            <View style={styles.noTeamText}>
              <Text style={styles.noTeamTitle}>Henüz bir takımın yok</Text>
              <Text style={styles.noTeamSub}>Takım kur ya da davet koduyla katıl</Text>
            </View>
            <TouchableOpacity style={styles.noTeamBtn} onPress={() => navigation.navigate('TeamSetup')}>
              <Text style={styles.noTeamBtnText}>Kur</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.noTeamBtn, { marginLeft: 8 }]} onPress={() => navigation.navigate('JoinTeam')}>
              <Text style={styles.noTeamBtnText}>Katıl</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Next Match Card */}
        {loadingMatches ? (
          <View style={[styles.matchCard, styles.matchCardLoading]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.matchCardLoadingText}>Maçlar yükleniyor...</Text>
          </View>
        ) : upcomingMatches.length > 0 ? (
          <TouchableOpacity
            style={styles.matchCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('MatchDetails', { matchId: upcomingMatches[0].id })}
          >
            <View style={styles.matchCardGradient} />
            <View style={styles.matchCardTop}>
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>{formatMatchDay(upcomingMatches[0].date)}</Text>
              </View>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => {
                  hapticLight();
                  const m = upcomingMatches[0];
                  const msg = `${formatMatchDay(m.date)} ${m.time} - ${m.venue || m.location || 'Saha'}. Sahada ile takip et.`;
                  Share.share({ message: msg, title: 'Maç daveti' });
                }}
              >
                <Icon name="share-variant" size={18} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.matchCardContent}>
              <Text style={styles.matchTime}>{upcomingMatches[0].time}</Text>
              <TouchableOpacity
                style={styles.matchLocation}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  if (upcomingMatches[0].venueId) {
                    navigation.navigate('VenueDetails', { venueId: upcomingMatches[0].venueId! });
                  }
                }}
                activeOpacity={upcomingMatches[0].venueId ? 0.7 : 1}
                disabled={!upcomingMatches[0].venueId}
              >
                <Icon name="map-marker" size={16} color={colors.primary} />
                <Text style={[styles.matchLocationText, !!upcomingMatches[0].venueId && styles.matchLocationLink]}>
                  {upcomingMatches[0].venue || upcomingMatches[0].location || 'Saha'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.matchCardBottom}>
              <Text style={styles.weatherText}>☁️ 18°C</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.matchCard, styles.matchCardEmpty]}>
            <Icon name="soccer" size={32} color={colors.text.tertiary} />
            <Text style={styles.matchCardEmptyText}>Sonraki maç planlanmadı</Text>
            {canCreate && (
              <TouchableOpacity style={styles.retryButton} onPress={() => navigation.navigate('MatchCreate')}>
                <Text style={styles.retryButtonText}>Maç Oluştur</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Actions - 4 column grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HIZLI İŞLEMLER</Text>
          <View style={styles.quickActions}>
            {visibleActions.map((action, idx) => (
              <QuickActionButton
                key={idx}
                icon={action.icon}
                label={action.label}
                color={action.color}
                onPress={action.onPress}
              />
            ))}
          </View>
        </View>

        {/* Match Prep Progress */}
        {upcomingMatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <View style={styles.progressTitle}>
                  <Icon name="weight-lifter" size={18} color={colors.text.tertiary} />
                  <Text style={styles.progressLabel}>Maç Hazırlığı</Text>
                </View>
                {(() => {
                  const m = upcomingMatches[0];
                  const yesCount = m.attendees?.filter((a) => a.status === 'YES').length ?? 0;
                  const total = m.capacity ?? 14;
                  return <Text style={styles.progressCount}>{yesCount}/{total} Hazır</Text>;
                })()}
              </View>
              <View style={styles.progressBar}>
                {(() => {
                  const m = upcomingMatches[0];
                  const yesCount = m.attendees?.filter((a) => a.status === 'YES').length ?? 0;
                  const total = m.capacity ?? 14;
                  const pct = total ? (yesCount / total) * 100 : 0;
                  return <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` }]} />;
                })()}
              </View>
              <View style={styles.progressFooter}>
                <View style={styles.avatarGroup}>
                  {[1, 2, 3].map((i) => (
                    <Image key={i} source={{ uri: `https://i.pravatar.cc/150?u=${i}` }} style={styles.miniAvatar} />
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.rsvpLink}
                  onPress={() => navigation.navigate('MatchDetails', { matchId: upcomingMatches[0].id })}
                >
                  <Text style={styles.rsvpLinkText}>Katılımını belirt</Text>
                  <Icon name="chevron-right" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function QuickActionButton({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}22` }]}>
        <Icon name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.quickActionLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
    gap: spacing.sm,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  profileInfo: { flex: 1, marginLeft: 4 },
  userName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignSelf: 'flex-start',
  },
  captainIcon: { fontSize: 10 },
  tierText: { fontSize: 9, fontWeight: typography.fontWeight.bold, color: colors.text.secondary },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  scrollContent: { paddingBottom: 100 },
  // No Team Banner
  noTeamBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  noTeamText: { flex: 1 },
  noTeamTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  noTeamSub: { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  noTeamBtn: {
    backgroundColor: colors.warning,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  noTeamBtnText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: '#000' },
  // Match Card
  matchCard: {
    height: 200,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surface,
    marginTop: spacing.lg,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    ...shadows.lg,
  },
  matchCardLoading: { justifyContent: 'center', alignItems: 'center' },
  matchCardLoadingText: { marginTop: spacing.sm, fontSize: typography.fontSize.sm, color: colors.text.secondary },
  matchCardEmpty: { justifyContent: 'center', alignItems: 'center' },
  matchCardEmptyText: { marginTop: spacing.sm, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semiBold, color: colors.text.secondary },
  retryButton: { marginTop: spacing.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.lg, backgroundColor: colors.primary, alignSelf: 'center' },
  retryButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.secondary },
  matchCardGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: `${colors.primary}18` },
  matchCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  todayBadge: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  todayBadgeText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: '#fff' },
  shareButton: { width: 32, height: 32, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border.light },
  matchCardContent: { flex: 1, justifyContent: 'flex-end' },
  matchTime: { fontSize: typography.fontSize.xxxl + 8, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  matchLocation: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  matchLocationText: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.medium, color: colors.text.secondary, marginLeft: spacing.xs },
  matchLocationLink: { textDecorationLine: 'underline', color: colors.primary },
  matchCardBottom: { position: 'absolute', bottom: spacing.lg, right: spacing.lg },
  weatherText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  // Section
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.text.tertiary, letterSpacing: 1.5, marginBottom: spacing.md },
  // Quick Actions - 4 col grid
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionButton: {
    width: ITEM_W,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: ITEM_W - 8,
    height: ITEM_W - 8,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 13,
  },
  // Progress Card
  progressCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border.light },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  progressTitle: { flexDirection: 'row', alignItems: 'center' },
  progressLabel: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginLeft: spacing.sm },
  progressCount: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.primary },
  progressBar: { height: 10, backgroundColor: colors.background.secondary, borderRadius: borderRadius.full, overflow: 'hidden', marginBottom: spacing.lg },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.full },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarGroup: { flexDirection: 'row' },
  miniAvatar: { width: 28, height: 28, borderRadius: borderRadius.full, borderWidth: 2, borderColor: colors.surface, marginLeft: -8 },
  rsvpLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rsvpLinkText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.primary },
});
