/**
 * Scout Reports Screen – Scout raporları (Firestore)
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { getScoutReports } from '../services/talent';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'ScoutReports'>;

const RECOMMENDATION_LABELS: Record<string, string> = {
  sign_now: 'Transfer Et',
  observe: 'İzle',
  reject: 'Reddet',
};

export default function ScoutReportsScreen() {
  const navigation = useNavigation<NavProp>();
  const [items, setItems] = useState<Awaited<ReturnType<typeof getScoutReports>>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const list = await getScoutReports();
    setItems(list);
  }, []);

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
        <Text style={styles.headerTitle}>Scout Raporları</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="file-document-search" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Henüz scout raporu yok</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                {item.scoutName ? (
                  <Text style={styles.scoutName}>{item.scoutName}</Text>
                ) : null}
                {item.date && <Text style={styles.date}>{item.date}</Text>}
              </View>
              <View style={styles.scoresRow}>
                {(item.overallScore ?? item.potential) != null && (
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreLabel}>Puan</Text>
                    <Text style={styles.scoreValue}>{item.overallScore ?? item.potential}</Text>
                  </View>
                )}
                {item.recommendation && (
                  <View style={[styles.recBadge, item.recommendation === 'sign_now' && styles.recSign]}>
                    <Text style={styles.recText}>
                      {RECOMMENDATION_LABELS[item.recommendation] || item.recommendation}
                    </Text>
                  </View>
                )}
              </View>
              {item.strengths && item.strengths.length > 0 && (
                <Text style={styles.strengths}>+ {item.strengths.join(', ')}</Text>
              )}
              {item.weaknesses && item.weaknesses.length > 0 && (
                <Text style={styles.weaknesses}>- {item.weaknesses.join(', ')}</Text>
              )}
            </View>
          ))
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
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  scoutName: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text.primary },
  date: { fontSize: typography.fontSize.sm, color: colors.text.tertiary },
  scoresRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  scoreBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}30`,
  },
  scoreLabel: { fontSize: typography.fontSize.xs, color: colors.text.tertiary },
  scoreValue: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.primary },
  recBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.warning}30`,
  },
  recSign: { backgroundColor: `${colors.success}30` },
  recText: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text.primary },
  strengths: { fontSize: typography.fontSize.sm, color: colors.success, marginTop: 4 },
  weaknesses: { fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginTop: 2 },
});
