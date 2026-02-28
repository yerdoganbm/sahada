/**
 * Scout Dashboard Screen – Scout özet paneli (Firestore)
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
import { getTalentPool, getScoutReports } from '../services/talent';
import { getTeamIdForUser } from '../services/players';
import AppScrollView from '../components/AppScrollView';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'ScoutDashboard'>;

export default function ScoutDashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [talentCount, setTalentCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const teamId = user?.id ? await getTeamIdForUser(user.id) : undefined;
    const [talent, reports] = await Promise.all([
      getTalentPool(teamId),
      getScoutReports(),
    ]);
    setTalentCount(talent.length);
    setReportCount(reports.length);
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
        <Text style={styles.headerTitle}>Scout Paneli</Text>
        <View style={styles.placeholder} />
      </View>
      <AppScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('TalentPool')}
          >
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Icon name="star-circle" size={32} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{talentCount}</Text>
            <Text style={styles.statLabel}>Yetenek Havuzu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('ScoutReports')}
          >
            <View style={[styles.statIcon, { backgroundColor: `${colors.info}20` }]}>
              <Icon name="file-document-search" size={32} color={colors.info} />
            </View>
            <Text style={styles.statValue}>{reportCount}</Text>
            <Text style={styles.statLabel}>Raporlar</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('TalentPool')}
        >
          <Icon name="star-circle" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Yetenek Havuzu</Text>
          <Icon name="chevron-right" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('ScoutReports')}
        >
          <Icon name="file-document-search" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Scout Raporları</Text>
          <Icon name="chevron-right" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
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
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: { fontSize: typography.fontSize.xxl, fontWeight: '700', color: colors.text.primary },
  statLabel: { fontSize: typography.fontSize.sm, color: colors.text.secondary },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  menuText: { flex: 1, marginLeft: spacing.md, fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text.primary },
});
