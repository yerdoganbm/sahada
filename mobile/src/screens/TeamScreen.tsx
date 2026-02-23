/**
 * Team Screen – Takım kadrosu ve yönetimi
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { getPlayers, getTeamIdForUser } from '../services/players';
import { canManageMembers } from '../utils/permissions';
import { RootStackParamList } from '../types';
import type { Player } from '../types';

type TeamNavigationProp = StackNavigationProp<RootStackParamList>;

const POSITION_LABELS: Record<string, string> = {
  GK: 'Kaleci',
  DEF: 'Defans',
  MID: 'Orta Saha',
  FWD: 'Forvet',
};

const POSITION_COLORS: Record<string, string> = {
  GK: '#F59E0B',
  DEF: '#3B82F6',
  MID: '#10B981',
  FWD: '#EF4444',
};

export default function TeamScreen() {
  const navigation = useNavigation<TeamNavigationProp>();
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'>('ALL');

  const canManage = canManageMembers(user);
  const hasTeam = !!user?.teamId;

  const fetchPlayers = useCallback(async () => {
    const teamId = user?.teamId || (user?.id ? await getTeamIdForUser(user.id) : null);
    const list = await getPlayers(teamId ? { teamId } : undefined);
    setPlayers(list);
  }, [user?.teamId, user?.id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPlayers().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchPlayers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlayers();
    setRefreshing(false);
  }, [fetchPlayers]);

  const filtered = filter === 'ALL' ? players : players.filter((p) => p.position === filter);

  const stats = {
    total: players.length,
    avg: players.length ? Math.round(players.reduce((s, p) => s + p.rating, 0) / players.length * 10) / 10 : 0,
    gk: players.filter((p) => p.position === 'GK').length,
    def: players.filter((p) => p.position === 'DEF').length,
    mid: players.filter((p) => p.position === 'MID').length,
    fwd: players.filter((p) => p.position === 'FWD').length,
  };

  const shareTeam = () => {
    Share.share({
      message: `${user?.name ?? 'Takımımız'} - ${stats.total} oyuncu | Ortalama Rating: ${stats.avg} | Sahada uygulaması ile takip et.`,
    });
  };

  if (loading && players.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Kadro yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Takım</Text>
        <View style={styles.headerActions}>
          {hasTeam && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('TeamChat')}>
              <Icon name="forum" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
          {canManage && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('LineupManager')}>
              <Icon name="strategy" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={shareTeam}>
            <Icon name="share-variant" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          {canManage && (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: `${colors.primary}22` }]}
              onPress={() => navigation.navigate('MemberManagement')}
            >
              <Icon name="account-plus" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* No Team Banner */}
      {!hasTeam && (
        <View style={styles.noTeamBanner}>
          <Icon name="information" size={20} color={colors.info} />
          <Text style={styles.noTeamText}>Tüm oyuncular gösteriliyor. Takıma katılarak kadronuzu filtreleyin.</Text>
        </View>
      )}

      {/* Stats Row */}
      {players.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.total}</Text>
            <Text style={styles.statLbl}>Oyuncu</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: colors.primary }]}>{stats.avg}</Text>
            <Text style={styles.statLbl}>Ort. Rating</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: POSITION_COLORS.GK }]}>{stats.gk}</Text>
            <Text style={styles.statLbl}>KL</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: POSITION_COLORS.DEF }]}>{stats.def}</Text>
            <Text style={styles.statLbl}>DEF</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: POSITION_COLORS.MID }]}>{stats.mid}</Text>
            <Text style={styles.statLbl}>ORT</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: POSITION_COLORS.FWD }]}>{stats.fwd}</Text>
            <Text style={styles.statLbl}>FOR</Text>
          </View>
        </View>
      )}

      {/* Position Filter */}
      {players.length > 0 && (
        <View style={styles.filterRow}>
          {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as const).map((pos) => (
            <TouchableOpacity
              key={pos}
              style={[styles.filterBtn, filter === pos && styles.filterBtnActive]}
              onPress={() => setFilter(pos)}
            >
              <Text style={[styles.filterText, filter === pos && styles.filterTextActive]}>
                {pos === 'ALL' ? 'Tümü' : pos}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="account-group-outline" size={56} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>
              {players.length === 0 ? 'Henüz oyuncu yok' : 'Bu pozisyonda oyuncu yok'}
            </Text>
            {canManage && players.length === 0 && (
              <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('MemberManagement')}>
                <Icon name="account-plus" size={16} color="#fff" />
                <Text style={styles.addBtnText}>Oyuncu Ekle</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.playerCard}
            onPress={() => navigation.navigate('ProfileDetails', { userId: item.id })}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: item.avatar || `https://i.pravatar.cc/150?u=${item.id}` }}
              style={styles.avatar}
            />
            {item.shirtNumber != null && (
              <View style={styles.shirtNum}>
                <Text style={styles.shirtNumText}>{item.shirtNumber}</Text>
              </View>
            )}
            <View style={styles.playerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.playerName} numberOfLines={1}>{item.name}</Text>
                {item.isCaptain && <Icon name="star-circle" size={16} color={colors.warning} />}
                {item.role === 'admin' && <Icon name="shield-account" size={16} color={colors.primary} />}
              </View>
              <View style={styles.posRow}>
                <View style={[styles.posBadge, { backgroundColor: `${POSITION_COLORS[item.position] ?? colors.primary}22` }]}>
                  <Text style={[styles.posText, { color: POSITION_COLORS[item.position] ?? colors.primary }]}>
                    {POSITION_LABELS[item.position] ?? item.position}
                  </Text>
                </View>
                <View style={styles.reliabilityWrap}>
                  <Icon name="shield-check" size={12} color={item.reliability >= 80 ? colors.success : colors.warning} />
                  <Text style={styles.reliabilityText}>{item.reliability}%</Text>
                </View>
              </View>
            </View>
            <View style={[styles.ratingBadge, { backgroundColor: item.rating >= 8 ? colors.primary : item.rating >= 6 ? colors.info : colors.text.disabled }]}>
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, fontSize: typography.fontSize.sm, color: colors.text.secondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { fontSize: typography.fontSize.xxxl, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  noTeamBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
  },
  noTeamText: { flex: 1, fontSize: typography.fontSize.xs, color: colors.text.secondary, lineHeight: 16 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 6,
  },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border.light },
  statVal: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  statLbl: { fontSize: 9, color: colors.text.tertiary, marginTop: 2 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.text.secondary },
  filterTextActive: { color: '#fff' },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
  listEmpty: { flexGrow: 1 },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyText: { marginTop: spacing.md, fontSize: typography.fontSize.md, color: colors.text.secondary },
  addBtn: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: typography.fontSize.sm },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    position: 'relative',
  },
  avatar: { width: 52, height: 52, borderRadius: borderRadius.md },
  shirtNum: {
    position: 'absolute',
    left: spacing.md + 36,
    top: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.full,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  shirtNumText: { fontSize: 9, fontWeight: '800', color: colors.text.primary },
  playerInfo: { flex: 1, marginLeft: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playerName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary, flex: 1 },
  posRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  posBadge: { borderRadius: borderRadius.sm, paddingHorizontal: 8, paddingVertical: 2 },
  posText: { fontSize: 10, fontWeight: '700' },
  reliabilityWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reliabilityText: { fontSize: 10, color: colors.text.secondary },
  ratingBadge: { width: 38, height: 38, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center' },
  ratingText: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: '#fff' },
});
