/**
 * Profile Screen - Kendi profil veya başka oyuncu (userId ile)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { getPlayer } from '../services/players';
import type { Player } from '../types';

type ProfileNavigationProp = StackNavigationProp<RootStackParamList>;
type ProfileRouteProp = RouteProp<RootStackParamList, 'ProfileDetails'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { params } = useRoute<ProfileRouteProp>();
  const { user, logout } = useAuth();
  const userId = params?.userId;
  const isOwnProfile = !userId || userId === user?.id;

  const [profile, setProfile] = useState<Player | null>(null);
  const [loading, setLoading] = useState(!!userId);

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

  const handleLogout = async () => {
    await logout();
  };

  const displayUser = isOwnProfile ? user : profile;

  if (loading && !displayUser) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Profil yükleniyor...</Text>
      </View>
    );
  }

  if (!isOwnProfile && !loading && !profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon name="account-off" size={48} color={colors.text.tertiary} />
        <Text style={styles.loadingText}>Profil bulunamadı</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {isOwnProfile ? (
          <View style={styles.backBtn} />
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
        {isOwnProfile ? (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="cog" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      <View style={styles.profileSection}>
        <Image
          source={{ uri: displayUser?.avatar || `https://i.pravatar.cc/150?u=${displayUser?.id}` }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{displayUser?.name}</Text>
        <Text style={styles.role}>
          {displayUser?.role === 'admin' ? 'Yönetici' : 
           displayUser?.isCaptain ? 'Kaptan' : 'Üye'}
        </Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{displayUser?.rating ?? '-'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{displayUser?.reliability ?? 0}%</Text>
          <Text style={styles.statLabel}>Güvenilirlik</Text>
        </View>
      </View>

      {isOwnProfile && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Icon name="pencil" size={20} color={colors.text.primary} />
            <Text style={styles.actionText}>Profili Düzenle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Icon name="trophy" size={20} color={colors.text.primary} />
            <Text style={styles.actionText}>Sıralama</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PaymentLedger')}
          >
            <Icon name="receipt-text" size={20} color={colors.text.primary} />
            <Text style={styles.actionText}>Ödemeler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Icon name="crown" size={20} color={colors.text.primary} />
            <Text style={styles.actionText}>Abonelik</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Icon name="logout" size={20} color={colors.error} />
            <Text style={[styles.actionText, styles.logoutText]}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  role: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.lg,
  },
  actions: {
    paddingHorizontal: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  actionText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    color: colors.error,
  },
});
