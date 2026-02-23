/**
 * AttendanceScreen – Maç katılım takibi (Firestore)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { getMatches } from '../services/matches';
import type { Match } from '../types';

type AttendanceNavProp = StackNavigationProp<RootStackParamList, 'Attendance'>;

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function AttendanceScreen() {
  const navigation = useNavigation<AttendanceNavProp>();
  const { user } = useAuth();
  const teamId = user?.teamId;
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!teamId) {
      setMatches([]);
      setLoading(false);
      return;
    }
    const list = await getMatches({ teamId, upcoming: true });
    setMatches(list);
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    setLoading(true);
    fetchMatches();
  }, [fetchMatches]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, [fetchMatches]);

  if (!teamId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Katılım</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={[styles.centered, styles.flex1]}>
          <Icon name="account-group-outline" size={64} color={colors.text.disabled} />
          <Text style={styles.emptyText}>Takıma katılmadan katılım görüntülenemez</Text>
          <TouchableOpacity style={styles.joinBtn} onPress={() => navigation.navigate('JoinTeam')}>
            <Text style={styles.joinBtnText}>Takıma Katıl</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading && matches.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Match }) => {
    const yes = typeof item.goingCount === 'number'
      ? item.goingCount
      : item.attendees?.filter((a) => a.status === 'YES').length ?? 0;
    const no = item.attendees?.filter((a) => a.status === 'NO').length ?? 0;
    const maybe = item.attendees?.filter((a) => a.status === 'MAYBE').length ?? 0;
    const capacity = item.capacity ?? 14;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('MatchDetails', { matchId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
          <Text style={styles.cardTime}>{item.time}</Text>
        </View>
        <Text style={styles.cardVenue}>{item.venue || item.location}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, styles.badgeYes]}>
            <Icon name="check" size={14} color="#fff" />
            <Text style={styles.badgeText}>{yes}</Text>
          </View>
          <View style={[styles.badge, styles.badgeMaybe]}>
            <Icon name="help" size={14} color="#fff" />
            <Text style={styles.badgeText}>{maybe}</Text>
          </View>
          <View style={[styles.badge, styles.badgeNo]}>
            <Icon name="close" size={14} color="#fff" />
            <Text style={styles.badgeText}>{no}</Text>
          </View>
        </View>
        <Text style={styles.capacityText}>{yes}/{capacity} kişi</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Katılım</Text>
        <View style={styles.placeholder} />
      </View>

      {matches.length === 0 ? (
        <View style={[styles.centered, styles.flex1]}>
          <Icon name="calendar-blank-outline" size={64} color={colors.text.disabled} />
          <Text style={styles.emptyText}>Yaklaşan maç yok</Text>
          <Text style={styles.emptySub}>Maç eklendiğinde burada görünecek</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  flex1: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.text.secondary, marginTop: spacing.md },
  emptyText: { ...typography.body, color: colors.text.secondary, marginTop: spacing.md },
  emptySub: { ...typography.caption, color: colors.text.disabled, marginTop: spacing.xs },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, ...typography.h3, color: colors.text.primary, textAlign: 'center' },
  placeholder: { width: 40 },
  list: { padding: spacing.lg },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  cardDate: { ...typography.h3, color: colors.text.primary },
  cardTime: { ...typography.body, color: colors.text.secondary },
  cardVenue: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.md },
  badges: { flexDirection: 'row', gap: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  badgeYes: { backgroundColor: colors.success },
  badgeMaybe: { backgroundColor: colors.warning },
  badgeNo: { backgroundColor: colors.error },
  badgeText: { ...typography.caption, color: '#fff', fontWeight: '600' },
  capacityText: { ...typography.caption, color: colors.text.disabled, marginTop: spacing.sm },
  joinBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  joinBtnText: { ...typography.button, color: '#fff' },
});
