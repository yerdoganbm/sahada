/**
 * Dashboard Screen
 * Main home screen after login
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

type DashboardNavigationProp = StackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch latest data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isCaptain = user?.isCaptain;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
            activeOpacity={0.8}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?u=guest' }}
                style={styles.avatar}
              />
              <View style={styles.statusIndicator} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.tierBadge}>
              {isCaptain && <Text style={styles.captainIcon}>©️</Text>}
              <Text style={styles.tierText}>
                {user?.tier === 'partner' ? 'SAHA PARTNER' : 
                 user?.tier === 'premium' ? 'PRO BALLER' : 'STARTER ÜYE'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="cog" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="bell" size={20} color={colors.text.secondary} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Next Match Card */}
        <TouchableOpacity
          style={styles.matchCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('MatchDetails', { matchId: 'm1' })}
        >
          <View style={styles.matchCardGradient} />
          
          <View style={styles.matchCardTop}>
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>BUGÜN</Text>
            </View>
            <TouchableOpacity style={styles.shareButton}>
              <Icon name="share-variant" size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.matchCardContent}>
            <Text style={styles.matchTime}>Bu Akşam 20:00</Text>
            <View style={styles.matchLocation}>
              <Icon name="map-marker" size={16} color={colors.primary} />
              <Text style={styles.matchLocationText}>Şehir Stadı</Text>
            </View>
          </View>

          <View style={styles.matchCardBottom}>
            <Text style={styles.weatherText}>☁️ 18°C</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HIZLI İŞLEMLER</Text>
          
          <View style={styles.quickActions}>
            {isAdmin && (
              <>
                <QuickActionButton
                  icon="shield-account"
                  label="Yönetim"
                  color={colors.secondary}
                  onPress={() => navigation.navigate('Admin')}
                />
                <QuickActionButton
                  icon="account-plus"
                  label="Üyeler"
                  color="#3B82F6"
                  onPress={() => {}}
                />
              </>
            )}
            <QuickActionButton
              icon="account-group"
              label="Kadro"
              color="#10B981"
              onPress={() =>
                navigation.dispatch(
                  CommonActions.navigate('MainTabs', { screen: 'Team' })
                )
              }
            />
            <QuickActionButton
              icon="poll"
              label="Anketler"
              color="#F59E0B"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Match Prep Progress */}
        <View style={styles.section}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={styles.progressTitle}>
                <Icon name="weight-lifter" size={18} color={colors.text.tertiary} />
                <Text style={styles.progressLabel}>Maç Hazırlığı</Text>
              </View>
              <Text style={styles.progressCount}>12/14 Hazır</Text>
            </View>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '85%' }]} />
            </View>

            <View style={styles.progressFooter}>
              <View style={styles.avatarGroup}>
                {[1, 2, 3].map((i) => (
                  <Image
                    key={i}
                    source={{ uri: `https://i.pravatar.cc/150?u=${i}` }}
                    style={styles.miniAvatar}
                  />
                ))}
              </View>

              <View style={styles.rsvpButtons}>
                <TouchableOpacity style={[styles.rsvpButton, styles.rsvpButtonYes]}>
                  <Icon name="check" size={16} color={colors.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.rsvpButton}>
                  <Icon name="close" size={16} color={colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function QuickActionButton({ 
  icon, 
  label, 
  color, 
  onPress 
}: { 
  icon: string; 
  label: string; 
  color: string; 
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.quickActionButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <Icon name={icon} size={26} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
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
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  profileInfo: {
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  captainIcon: {
    marginRight: 4,
  },
  tierText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  matchCard: {
    height: 200,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surface,
    marginTop: spacing.lg,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    ...shadows.lg,
  },
  matchCardGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${colors.primary}20`,
  },
  matchCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  todayBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  matchCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  matchTime: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  matchLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  matchLocationText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  matchCardBottom: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
  },
  weatherText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  progressCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarGroup: {
    flexDirection: 'row',
    marginLeft: -spacing.xs,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.surface,
    marginLeft: -spacing.xs,
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rsvpButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  rsvpButtonYes: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
