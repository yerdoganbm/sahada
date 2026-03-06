/**
 * TeamListScreen – Takım kadro görünümü
 * Sekmeler: "Takımım" ve "Scout". Arama, pozisyon filtresi, oyuncu kartları.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AppScrollView from '../components/AppScrollView';
import { colors, spacing, borderRadius, typography } from '../theme';

type TabKey = 'team' | 'scout';
type Position = 'GK' | 'DEF' | 'MID' | 'FWD';
type FilterKey = Position | 'all';

interface Player {
  id: string;
  name: string;
  position: Position;
  rating: number;
  avatarUrl?: string;
}

const POSITION_LABELS: Record<Position, string> = {
  GK: 'Kaleci',
  DEF: 'Defans',
  MID: 'Ortasaha',
  FWD: 'Forvet',
};

const POSITION_COLORS: Record<Position, string> = {
  GK: '#F59E0B',
  DEF: '#3B82F6',
  MID: '#10B981',
  FWD: '#EF4444',
};

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'GK', label: 'GK' },
  { key: 'DEF', label: 'DEF' },
  { key: 'MID', label: 'MID' },
  { key: 'FWD', label: 'FWD' },
];

const MOCK_TEAM: Player[] = [
  { id: '1', name: 'Emre Yılmaz', position: 'GK', rating: 7.8 },
  { id: '2', name: 'Burak Kaya', position: 'DEF', rating: 7.2 },
  { id: '3', name: 'Cem Demir', position: 'DEF', rating: 6.9 },
  { id: '4', name: 'Serkan Öz', position: 'MID', rating: 8.1 },
  { id: '5', name: 'Ali Çelik', position: 'MID', rating: 7.5 },
  { id: '6', name: 'Murat Şahin', position: 'FWD', rating: 8.4 },
  { id: '7', name: 'Kerem Tunç', position: 'FWD', rating: 7.0 },
];

const MOCK_SCOUT: Player[] = [
  { id: 's1', name: 'Oğuz Akman', position: 'MID', rating: 7.6 },
  { id: 's2', name: 'Tolga Baran', position: 'FWD', rating: 8.0 },
  { id: 's3', name: 'Deniz Kurt', position: 'DEF', rating: 7.3 },
  { id: 's4', name: 'Hakan Polat', position: 'GK', rating: 6.8 },
  { id: 's5', name: 'Yusuf Er', position: 'MID', rating: 7.9 },
];

export default function TeamListScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('team');
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<FilterKey>('all');

  const players = activeTab === 'team' ? MOCK_TEAM : MOCK_SCOUT;

  const filtered = useMemo(() => {
    let list = players;
    if (posFilter !== 'all') {
      list = list.filter((p) => p.position === posFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [players, posFilter, search]);

  const renderPlayerCard = (player: Player) => {
    const posColor = POSITION_COLORS[player.position];
    return (
      <TouchableOpacity key={player.id} style={styles.playerCard} activeOpacity={0.7}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: `${posColor}20` }]}>
          <Icon name="account" size={28} color={posColor} />
        </View>

        {/* Info */}
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          <View style={styles.playerMeta}>
            <View style={[styles.positionBadge, { backgroundColor: `${posColor}20` }]}>
              <Text style={[styles.positionText, { color: posColor }]}>
                {player.position}
              </Text>
            </View>
            <Text style={styles.positionLabel}>{POSITION_LABELS[player.position]}</Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <Text style={[styles.rating, { color: player.rating >= 8 ? colors.success : player.rating >= 7 ? colors.primary : colors.text.secondary }]}>
            {player.rating.toFixed(1)}
          </Text>
          <Icon name="star" size={12} color={colors.warning} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kadro</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab Switch */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'team' && styles.tabActive]}
          onPress={() => setActiveTab('team')}
        >
          <Icon
            name="account-group"
            size={16}
            color={activeTab === 'team' ? colors.primary : colors.text.secondary}
          />
          <Text style={[styles.tabText, activeTab === 'team' && styles.tabTextActive]}>
            Takımım
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'scout' && styles.tabActive]}
          onPress={() => setActiveTab('scout')}
        >
          <Icon
            name="binoculars"
            size={16}
            color={activeTab === 'scout' ? colors.primary : colors.text.secondary}
          />
          <Text style={[styles.tabText, activeTab === 'scout' && styles.tabTextActive]}>
            Scout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Oyuncu ara..."
            placeholderTextColor={colors.text.disabled}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close-circle" size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Position Filter */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.filterChip,
              posFilter === opt.key && styles.filterChipActive,
            ]}
            onPress={() => setPosFilter(opt.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                posFilter === opt.key && styles.filterChipTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Player List */}
      <AppScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.countLabel}>
          {filtered.length} oyuncu
        </Text>

        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="account-search" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Oyuncu bulunamadı</Text>
          </View>
        ) : (
          filtered.map(renderPlayerCard)
        )}
      </AppScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
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
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  // Search
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  // Filter
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterChipActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  // Scroll
  scrollContent: { flex: 1 },
  scrollInner: { padding: spacing.lg, paddingBottom: 100 },
  countLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  // Player card
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  playerInfo: { flex: 1 },
  playerName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  positionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  positionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  positionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  // Rating
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  rating: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  // Empty
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});
