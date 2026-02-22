/**
 * MessageLogsScreen – Mesaj / bildirim geçmişi (Firestore)
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
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { getNotifications, markNotificationRead, type NotificationItem } from '../services/firestore';

type MessageLogsNavProp = StackNavigationProp<RootStackParamList, 'MessageLogs'>;

const TYPE_ICONS: Record<string, string> = {
  match: 'soccer',
  payment: 'cash',
  squad: 'account-group',
  social: 'chat',
  system: 'bell',
};

export default function MessageLogsScreen() {
  const navigation = useNavigation<MessageLogsNavProp>();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const list = await getNotifications();
    setNotifications(list);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const onItemPress = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        await markNotificationRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
        );
      } catch (e) {
        console.warn('markNotificationRead failed', e);
      }
    }
  };

  if (loading && notifications.length === 0) {
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
        <Text style={styles.headerTitle}>Mesaj Kayıtları</Text>
        <View style={styles.placeholder} />
      </View>

      {notifications.length === 0 ? (
        <View style={[styles.centered, styles.flex1]}>
          <Icon name="message-text-outline" size={64} color={colors.text.disabled} />
          <Text style={styles.emptyText}>Henüz mesaj yok</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.read && styles.cardUnread]}
              onPress={() => onItemPress(item)}
            >
              <View style={styles.iconWrap}>
                <Icon
                  name={(TYPE_ICONS[item.type] || 'bell') as any}
                  size={24}
                  color={item.read ? colors.text.disabled : colors.primary}
                />
              </View>
              <View style={styles.content}>
                <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.body} numberOfLines={2}>
                  {item.body}
                </Text>
                {item.time ? (
                  <Text style={styles.time}>{item.time}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  iconWrap: { marginRight: spacing.md },
  content: { flex: 1 },
  title: { ...typography.body, color: colors.text.primary },
  titleUnread: { fontWeight: '600' },
  body: { ...typography.caption, color: colors.text.secondary, marginTop: 4 },
  time: { ...typography.caption, color: colors.text.disabled, marginTop: 4 },
});
