/**
 * Notifications Screen – Bildirimler listesi
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type NotificationsNavProp = StackNavigationProp<RootStackParamList, 'Notifications'>;

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'match', title: 'Maç hatırlatması', body: 'Yarın 14:00 – Yeşil Saha maçına 2 saat kaldı.', time: '1 saat önce', read: false },
  { id: '2', type: 'squad', title: 'Kadro açıklandı', body: 'Ahmet Kaptan kadroyu yayınladı. Katılımını belirt.', time: '3 saat önce', read: true },
  { id: '3', type: 'payment', title: 'Ödeme hatırlatması', body: 'Bu ayın aidat ödemesi bekleniyor.', time: '1 gün önce', read: true },
];

export default function NotificationsScreen() {
  const navigation = useNavigation<NotificationsNavProp>();
  const items = MOCK_NOTIFICATIONS;

  const getIcon = (type: string) => {
    switch (type) {
      case 'match': return 'soccer';
      case 'squad': return 'account-group';
      case 'payment': return 'cash';
      default: return 'bell';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="bell-off" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Henüz bildirim yok</Text>
          </View>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, !item.read && styles.cardUnread]}
              activeOpacity={0.8}
            >
              <View style={styles.iconWrap}>
                <Icon name={getIcon(item.type) as any} size={22} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardBody}>{item.body}</Text>
                <Text style={styles.cardTime}>{item.time}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
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
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  placeholder: { width: 40 },
  content: { flex: 1 },
  contentInner: { padding: spacing.lg, paddingBottom: 100 },
  empty: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  cardBody: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  cardTime: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
    marginTop: spacing.xs,
  },
});
