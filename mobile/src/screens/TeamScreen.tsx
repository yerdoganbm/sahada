/**
 * Team Screen - Kadro listesi (API + fallback)
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';
import { getPlayers } from '../services/players';
import { RootStackParamList } from '../types';
import type { Player } from '../types';

type TeamNavigationProp = StackNavigationProp<RootStackParamList>;

const FALLBACK_PLAYERS: Player[] = [
  { id: '1', name: 'Ahmet Yılmaz', position: 'MID', rating: 8.5, reliability: 95, avatar: 'https://i.pravatar.cc/150?u=1', role: 'admin' },
  { id: '2', name: 'Mehmet Demir', position: 'DEF', rating: 7.2, reliability: 88, avatar: 'https://i.pravatar.cc/150?u=2', role: 'member' },
  { id: '7', name: 'Burak Yılmaz', position: 'FWD', rating: 8.0, reliability: 90, avatar: 'https://i.pravatar.cc/150?u=7', role: 'member' },
];

export default function TeamScreen() {
  const navigation = useNavigation<TeamNavigationProp>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlayers = useCallback(async () => {
    const list = await getPlayers();
    setPlayers(list.length > 0 ? list : FALLBACK_PLAYERS);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPlayers().then((list) => {
      if (!cancelled) setPlayers(list.length > 0 ? list : FALLBACK_PLAYERS);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlayers();
    setRefreshing(false);
  }, [fetchPlayers]);

  if (loading && players.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Kadro yükleniyor...</Text>
      </View>
    );
  }

  const list = players.length > 0 ? players : FALLBACK_PLAYERS;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Takım</Text>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, list.length === 0 && styles.listEmpty]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="account-group" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Henüz kayıtlı oyuncu yok</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Yeniden dene</Text>
            </TouchableOpacity>
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
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{item.name}</Text>
              <Text style={styles.playerPosition}>
                {item.position}
                {item.isCaptain && ' • Kaptan'}
              </Text>
            </View>
            <View style={styles.playerRating}>
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  list: {
    padding: spacing.lg,
  },
  listEmpty: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  empty: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.secondary,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
  },
  playerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  playerName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  playerPosition: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  playerRating: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
});
