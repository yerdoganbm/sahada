import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getTeamById, type TeamBasic } from '../../services/firestore';
import { colors, spacing, borderRadius, typography } from '../../theme';

export default function TeamSwitchScreen() {
  const navigation = useNavigation();
  const { user, memberships, activeTeamId, switchActiveTeam } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Record<string, TeamBasic | null>>({});

  const teamIds = useMemo(() => memberships.map((m) => m.teamId).filter(Boolean), [memberships]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const entries = await Promise.all(
          teamIds.map(async (id) => [id, await getTeamById(id)] as const)
        );
        if (!cancelled) {
          setTeams(Object.fromEntries(entries));
        }
      } catch (e) {
        console.warn('TeamSwitchScreen load failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamIds]);

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyTitle}>Giriş yapmanız gerekiyor</Text>
      </View>
    );
  }

  const onSelectTeam = async (teamId: string) => {
    try {
      await switchActiveTeam(teamId);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Takım değiştirilemedi');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Takım Değiştir</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TeamSetup' as never)}>
            <Icon name="soccer" size={18} color={colors.primary} />
            <Text style={styles.actionTitle}>Takım Kur</Text>
            <Text style={styles.actionSub}>Yeni takım oluştur</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('JoinTeam' as never)}>
            <Icon name="account-plus-outline" size={18} color={colors.primary} />
            <Text style={styles.actionTitle}>Takıma Katıl</Text>
            <Text style={styles.actionSub}>Kod ile katıl</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => Alert.alert('Yakında', 'Organizasyon ekranı P1 sonrası eklenecek.')}
          >
            <Icon name="office-building" size={18} color={colors.primary} />
            <Text style={styles.actionTitle}>Organizasyonlar</Text>
            <Text style={styles.actionSub}>Kurumsal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AKTİF ÜYELİKLER</Text>
          <Text style={styles.sectionSub}>
            Aktif takım: <Text style={styles.sectionSubStrong}>{activeTeamId ?? 'Yok'}</Text>
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Takımlar yükleniyor...</Text>
          </View>
        ) : memberships.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="account-group-outline" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>Aktif üyelik yok</Text>
            <Text style={styles.emptySub}>Bir takım kur veya davet kodu ile katıl.</Text>
          </View>
        ) : (
          memberships.map((m) => {
            const t = teams[m.teamId];
            const isActive = activeTeamId === m.teamId || user.teamId === m.teamId;
            return (
              <View key={m.id} style={styles.teamRow}>
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>{t?.name ?? `Takım ${m.teamId}`}</Text>
                  <Text style={styles.teamMeta}>
                    {t?.shortName ? `${t.shortName} • ` : ''}{m.roleId}
                  </Text>
                </View>
                {isActive ? (
                  <View style={styles.activeBadge}>
                    <Icon name="check-circle" size={14} color={colors.success} />
                    <Text style={styles.activeBadgeText}>Aktif</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.selectBtn} onPress={() => onSelectTeam(m.teamId)}>
                    <Text style={styles.selectBtnText}>Seç</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary },
  placeholder: { width: 40 },
  content: { padding: spacing.lg, paddingBottom: 120 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
    gap: 4,
  },
  actionTitle: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.text.primary },
  actionSub: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  sectionHeader: { marginBottom: spacing.sm },
  sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: colors.text.tertiary },
  sectionSub: { marginTop: 4, fontSize: typography.fontSize.xs, color: colors.text.secondary },
  sectionSubStrong: { fontWeight: '700', color: colors.text.primary },
  loadingText: { marginTop: spacing.sm, fontSize: typography.fontSize.xs, color: colors.text.secondary },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyTitle: { marginTop: spacing.md, fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary },
  emptySub: { marginTop: spacing.xs, fontSize: typography.fontSize.sm, color: colors.text.secondary, textAlign: 'center' },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  teamInfo: { flex: 1, marginRight: spacing.md },
  teamName: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary },
  teamMeta: { marginTop: 2, fontSize: typography.fontSize.xs, color: colors.text.secondary },
  selectBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  selectBtnText: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.secondary },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  activeBadgeText: { fontSize: typography.fontSize.xs, fontWeight: '700', color: colors.success },
});

