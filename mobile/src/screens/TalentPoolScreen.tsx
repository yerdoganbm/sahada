/**
 * Talent Pool Screen – Yetenek havuzu (Firestore)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getTalentPool } from '../services/talent';
import { getTeamIdForUser } from '../services/players';
import AppScrollView from '../components/AppScrollView';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'TalentPool'>;

const STATUS_LABELS: Record<string, string> = {
  in_trial: 'Deneme',
  pending_approval: 'Onay Bekliyor',
  promoted: 'Kadroda',
};

export default function TalentPoolScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [items, setItems] = useState<Awaited<ReturnType<typeof getTalentPool>>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const teamId = user?.id ? await getTeamIdForUser(user.id) : undefined;
    const list = await getTalentPool(teamId);
    setItems(list);
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

  if (loading && items.length === 0) {
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
        <Text style={styles.headerTitle}>Yetenek Havuzu</Text>
        <View style={styles.placeholder} />
      </View>
      <AppScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="star-circle" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Henüz yetenek eklenmemiş</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Icon name="account" size={24} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardPosition}>{item.position}</Text>
                {(item.averageScore ?? item.potentialRating) != null && (
                  <Text style={styles.cardScore}>
                    Puan: {item.averageScore ?? item.potentialRating}
                    {item.source && ` • ${item.source}`}
                  </Text>
                )}
              </View>
              {item.status && (
                <View style={[styles.statusBadge, item.status === 'promoted' && styles.statusPromoted]}>
                  <Text style={styles.statusText}>{STATUS_LABELS[item.status] || item.status}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </AppScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: { flex: 1 },
  cardName: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text.primary },
  cardPosition: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: 2 },
  cardScore: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.warning}30`,
  },
  statusPromoted: { backgroundColor: `${colors.success}30` },
  statusText: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.text.primary },
});
