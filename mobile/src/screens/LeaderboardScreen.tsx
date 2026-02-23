/**
 * Leaderboard – Sıralama tablosu (Rating, Güvenilirlik)
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getPlayers } from '../services/players';
import { colors, spacing, borderRadius, typography } from '../theme';
import type { Player } from '../types';

const POS_LABEL: Record<string, string> = { GK: 'Kaleci', DEF: 'Defans', MID: 'Orta Saha', FWD: 'Forvet' };

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filter, setFilter] = useState<'rating' | 'reliability'>('rating');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    setLoading(true);
    getPlayers().then(setPlayers).finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(() => {
    const list = players.filter((p) => p.role !== 'venue_owner');
    if (filter === 'rating') return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return [...list].sort((a, b) => (b.reliability ?? 0) - (a.reliability ?? 0));
  }, [players, filter]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.text.secondary }}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sıralama</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'rating' && styles.filterBtnActive]}
          onPress={() => setFilter('rating')}
        >
          <Icon name="star" size={18} color={filter === 'rating' ? colors.secondary : colors.text.secondary} />
          <Text style={[styles.filterText, filter === 'rating' && styles.filterTextActive]}>Rating</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'reliability' && styles.filterBtnActive]}
          onPress={() => setFilter('reliability')}
        >
          <Icon name="shield-check" size={18} color={filter === 'reliability' ? colors.secondary : colors.text.secondary} />
          <Text style={[styles.filterText, filter === 'reliability' && styles.filterTextActive]}>Güvenilirlik</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <View style={[styles.rankBadge, index < 3 && styles.rankBadgeTop]}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <Image source={{ uri: item.avatar || `https://i.pravatar.cc/150?u=${item.id}` }} style={styles.avatar} />
            <View style={styles.rowContent}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.pos}>{POS_LABEL[item.position] || item.position}</Text>
            </View>
            <Text style={styles.value}>
              {filter === 'rating' ? (item.rating ?? 0).toFixed(1) : `${item.reliability ?? 0}%`}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
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
  headerTitle: { flex: 1, fontSize: typography.fontSize.xl, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  placeholder: { width: 40 },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  filterBtnActive: { backgroundColor: colors.primary },
  filterText: { fontSize: typography.fontSize.md, color: colors.text.secondary },
  filterTextActive: { color: colors.secondary, fontWeight: '600' },
  list: { padding: spacing.lg, paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankBadgeTop: { backgroundColor: colors.primary },
  rankText: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.text.primary },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: spacing.md },
  rowContent: { flex: 1 },
  name: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text.primary },
  pos: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  value: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.primary },
});
