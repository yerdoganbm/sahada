/**
 * Profile Screen – Kendi profil veya başka oyuncu
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AppScrollView from '../components/AppScrollView';
import { RootStackParamList } from '../types';
import { colors as staticColors, spacing, borderRadius, typography, shadows } from '../theme';
import { getPlayer } from '../services/players';
import type { Player } from '../types';

type ProfileNavigationProp = StackNavigationProp<RootStackParamList>;

const POSITION_LABELS: Record<string, string> = {
  GK: 'Kaleci', DEF: 'Defans', MID: 'Orta Saha', FWD: 'Forvet',
};
const POSITION_COLORS: Record<string, string> = {
  GK: '#F59E0B', DEF: '#3B82F6', MID: '#10B981', FWD: '#EF4444',
};
const TIER_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  free: { label: 'Starter', color: '#64748B', icon: 'soccer' },
  premium: { label: 'Pro Baller', color: '#10B981', icon: 'star-circle' },
  partner: { label: 'Saha Partner', color: '#F59E0B', icon: 'crown' },
};

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const route = useRoute();
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  // Tab olarak ya da ProfileDetails stack screen olarak kullanılabilir
  const userId = (route.params as { userId?: string } | undefined)?.userId;
  const isOwnProfile = !userId || userId === user?.id;

  const [profile, setProfile] = useState<Player | null>(null);
  const [loading, setLoading] = useState(!!userId && userId !== user?.id);

  useEffect(() => {
    if (!userId || userId === user?.id) {
      setProfile(user ?? null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getPlayer(userId).then((p) => {
      if (!cancelled) setProfile(p ?? null);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, user?.id]);

  const displayUser = isOwnProfile ? user : profile;
  const tier = TIER_LABELS[displayUser?.tier ?? 'free'] ?? TIER_LABELS.free;
  const posColor = POSITION_COLORS[displayUser?.position ?? 'MID'] ?? '#10B981';

  const shareProfile = async () => {
    const message = `${displayUser?.name} | ${POSITION_LABELS[displayUser?.position ?? 'MID']} | Rating: ${displayUser?.rating} | Sahada`;
    try {
      if (typeof Share?.share === 'function') {
        await Share.share({ message, title: displayUser?.name ?? 'Profil' });
      } else if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ text: message, title: displayUser?.name ?? 'Profil' });
      }
    } catch (e) {
      if ((e as Error).message?.includes('cancel') === false) {
        console.warn('Share failed', e);
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Profil yükleniyor...</Text>
      </View>
    );
  }

  if (!isOwnProfile && !loading && !profile) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background.primary }]}>
        <Icon name="account-off" size={56} color={colors.text.tertiary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Profil bulunamadı</Text>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <AppScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        {isOwnProfile ? (
          <View style={styles.placeholder} />
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
            <Icon name="arrow-left" size={22} color={colors.text.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.surface }]} onPress={shareProfile}>
            <Icon name="share-variant" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          {isOwnProfile && (
            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Settings')}>
              <Icon name="cog" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Avatar & Info */}
      <View style={styles.profileHero}>
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: displayUser?.avatar || `https://i.pravatar.cc/150?u=${displayUser?.id}` }}
            style={styles.avatar}
          />
          {/* Online dot for own profile */}
          {isOwnProfile && <View style={[styles.onlineDot, { borderColor: colors.background.primary }]} />}
          {/* Shirt number */}
          {displayUser?.shirtNumber != null && (
            <View style={[styles.shirtBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.shirtText}>{displayUser.shirtNumber}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.name, { color: colors.text.primary }]}>{displayUser?.name}</Text>

        {/* Role badges */}
        <View style={styles.badgeRow}>
          {displayUser?.role === 'admin' && (
            <View style={[styles.roleBadge, { backgroundColor: '#6366F122' }]}>
              <Icon name="shield-account" size={12} color="#6366F1" />
              <Text style={[styles.roleText, { color: '#6366F1' }]}>Yönetici</Text>
            </View>
          )}
          {displayUser?.isCaptain && (
            <View style={[styles.roleBadge, { backgroundColor: '#F59E0B22' }]}>
              <Icon name="star" size={12} color="#F59E0B" />
              <Text style={[styles.roleText, { color: '#F59E0B' }]}>Kaptan</Text>
            </View>
          )}
          <View style={[styles.roleBadge, { backgroundColor: `${posColor}20` }]}>
            <Text style={[styles.roleText, { color: posColor }]}>
              {POSITION_LABELS[displayUser?.position ?? 'MID']}
            </Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: `${tier.color}18` }]}>
            <Icon name={tier.icon as any} size={12} color={tier.color} />
            <Text style={[styles.roleText, { color: tier.color }]}>{tier.label}</Text>
          </View>
        </View>
      </View>

      {/* Kişisel iletişim */}
      {(displayUser?.phone || displayUser?.email) && (
        <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border.light }]}>
          <Text style={[styles.contactTitle, { color: colors.text.tertiary }]}>İLETİŞİM</Text>
          {displayUser.phone ? (
            <View style={styles.contactRow}>
              <Icon name="phone" size={16} color={colors.text.secondary} />
              <Text style={[styles.contactText, { color: colors.text.primary }]}>{displayUser.phone}</Text>
            </View>
          ) : null}
          {displayUser.email ? (
            <View style={styles.contactRow}>
              <Icon name="email" size={16} color={colors.text.secondary} />
              <Text style={[styles.contactText, { color: colors.text.primary }]}>{displayUser.email}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Stats */}
      <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border.light }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{displayUser?.rating?.toFixed(1) ?? '–'}</Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Rating</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border.light }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: displayUser?.reliability && displayUser.reliability >= 80 ? staticColors.success : staticColors.warning }]}>
            {displayUser?.reliability ?? 0}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Güvenilirlik</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border.light }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {displayUser?.shirtNumber != null ? `#${displayUser.shirtNumber}` : '–'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Forma</Text>
        </View>
      </View>

      {/* FIFA-style attributes if available */}
      {displayUser?.attributes && (
        <View style={[styles.attrsCard, { backgroundColor: colors.surface, borderColor: colors.border.light }]}>
          <Text style={[styles.attrsTitle, { color: colors.text.tertiary }]}>NİTELİKLER</Text>
          <View style={styles.attrsGrid}>
            {[
              { key: 'pac', label: 'HIZ' },
              { key: 'sho', label: 'ŞUT' },
              { key: 'pas', label: 'PAS' },
              { key: 'dri', label: 'TOP' },
              { key: 'def', label: 'SAV' },
              { key: 'phy', label: 'GÜÇ' },
            ].map(({ key, label }) => {
              const val = (displayUser.attributes as any)[key] ?? 0;
              return (
                <View key={key} style={styles.attrItem}>
                  <Text style={[styles.attrVal, { color: val >= 80 ? staticColors.success : val >= 60 ? colors.primary : staticColors.warning }]}>{val}</Text>
                  <Text style={[styles.attrLabel, { color: colors.text.tertiary }]}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Own Profile Actions */}
      {isOwnProfile && (
        <View style={styles.actions}>
          {[
            { icon: 'pencil', label: 'Profili Düzenle', onPress: () => navigation.navigate('EditProfile'), accent: false },
            { icon: 'forum', label: 'Takım Sohbeti', onPress: () => navigation.navigate('TeamChat'), accent: false },
            { icon: 'trophy', label: 'Sıralama', onPress: () => navigation.navigate('Leaderboard'), accent: false },
            { icon: 'receipt-text', label: 'Ödemelerim', onPress: () => navigation.navigate('PaymentLedger', { myPaymentsOnly: true }), accent: false },
            { icon: 'crown', label: 'Abonelik', onPress: () => navigation.navigate('Subscription'), accent: false },
            { icon: 'account-cog', label: 'Hesap Ayarları', onPress: () => navigation.navigate('Settings'), accent: false },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.actionRow, { backgroundColor: colors.surface, borderColor: colors.border.light }]}
              onPress={item.onPress}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: `${colors.primary}18` }]}>
                <Icon name={item.icon as any} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text.primary }]}>{item.label}</Text>
              <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.actionRow, styles.logoutRow]}
            onPress={logout}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <Icon name="logout" size={20} color={staticColors.error} />
            </View>
            <Text style={[styles.actionLabel, { color: staticColors.error }]}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </AppScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loadingText: { marginTop: spacing.md, fontSize: typography.fontSize.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  placeholder: { width: 40 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHero: { alignItems: 'center', paddingVertical: spacing.xl },
  avatarWrap: { position: 'relative', marginBottom: spacing.md },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: staticColors.primary },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: staticColors.success, borderWidth: 2 },
  shirtBadge: { position: 'absolute', top: 0, right: -8, borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  shirtText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  name: { fontSize: 26, fontWeight: '800', marginBottom: spacing.sm },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  roleText: { fontSize: 11, fontWeight: '700' },
  contactCard: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  contactTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: spacing.sm },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  contactText: { fontSize: typography.fontSize.sm },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: typography.fontSize.xxl, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: typography.fontSize.xs },
  statDivider: { width: 1, marginHorizontal: spacing.md },
  attrsCard: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  attrsTitle: { fontSize: typography.fontSize.xs, fontWeight: '700', letterSpacing: 1.5, marginBottom: spacing.md },
  attrsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  attrItem: { alignItems: 'center', width: 44 },
  attrVal: { fontSize: 20, fontWeight: '800' },
  attrLabel: { fontSize: 9, fontWeight: '700', marginTop: 2 },
  actions: { paddingHorizontal: spacing.lg },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    gap: spacing.md,
  },
  actionIconWrap: { width: 36, height: 36, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { flex: 1, fontSize: typography.fontSize.md, fontWeight: '600' },
  logoutRow: { backgroundColor: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.lg },
  actionBtnText: { color: '#fff', fontWeight: '700' },
});
