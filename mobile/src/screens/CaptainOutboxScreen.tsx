/**
 * Captain Outbox Screen
 * Outbox messages list with filters, copy actions, grouped by team
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../theme';
import AppScrollView from '../components/AppScrollView';

type MessageStatus = 'draft' | 'copied' | 'sent';
type FilterType = 'all' | 'draft' | 'copied';

interface OutboxMessage {
  id: string;
  recipient: string;
  body: string;
  status: MessageStatus;
  teamName?: string;
  createdAt: string;
}

const MOCK_MESSAGES: OutboxMessage[] = [
  { id: '1', recipient: 'Ahmet Yılmaz', body: 'Yarınki maç saat 20:00\'de Yıldız Halı Saha\'da. Katılım durumunu bildir.', status: 'copied', teamName: 'Takım A', createdAt: '2024-01-15' },
  { id: '2', recipient: 'Mehmet Demir', body: 'Haftalık aidat ödemeni hatırlatırım. IBAN bilgisi profilde mevcut.', status: 'draft', teamName: 'Takım A', createdAt: '2024-01-15' },
  { id: '3', recipient: 'Can Özkan', body: 'Antrenman saati değişti, yeni saat 18:30. Lütfen zamanında gel.', status: 'copied', teamName: 'Takım A', createdAt: '2024-01-14' },
  { id: '4', recipient: 'Emre Kaya', body: 'Maç forması dağıtımı cumartesi yapılacak. Beden bilgini gönder.', status: 'draft', teamName: 'Takım B', createdAt: '2024-01-14' },
  { id: '5', recipient: 'Burak Şahin', body: 'Saha rezervasyonu onaylandı. Ödeme bilgileri mesajda.', status: 'copied', teamName: 'Takım B', createdAt: '2024-01-13' },
];

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'draft', label: 'Taslak' },
  { key: 'copied', label: 'Kopyalandı' },
];

export default function CaptainOutboxScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [messages, setMessages] = useState<OutboxMessage[]>(MOCK_MESSAGES);

  const filteredMessages = messages.filter((m) => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  // Group by team
  const groupedMessages: Record<string, OutboxMessage[]> = {};
  filteredMessages.forEach((msg) => {
    const team = msg.teamName || 'Genel';
    if (!groupedMessages[team]) groupedMessages[team] = [];
    groupedMessages[team].push(msg);
  });

  const handleCopy = async (msg: OutboxMessage) => {
    try {
      await Clipboard.setStringAsync(msg.body);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: 'copied' as MessageStatus } : m)),
      );
      Alert.alert('Kopyalandı', 'Mesaj panoya kopyalandı.');
    } catch {
      Alert.alert('Hata', 'Kopyalama başarısız.');
    }
  };

  const handleCopyAll = async () => {
    const allBodies = filteredMessages.map((m) => `${m.recipient}: ${m.body}`).join('\n\n');
    try {
      await Clipboard.setStringAsync(allBodies);
      setMessages((prev) =>
        prev.map((m) => {
          const inFiltered = filteredMessages.find((fm) => fm.id === m.id);
          return inFiltered ? { ...m, status: 'copied' as MessageStatus } : m;
        }),
      );
      Alert.alert('Tümü Kopyalandı', `${filteredMessages.length} mesaj panoya kopyalandı.`);
    } catch {
      Alert.alert('Hata', 'Kopyalama başarısız.');
    }
  };

  const getStatusColor = (status: MessageStatus) => {
    switch (status) {
      case 'copied':
        return colors.success;
      case 'draft':
        return colors.warning;
      case 'sent':
        return colors.info;
      default:
        return colors.text.tertiary;
    }
  };

  const getStatusLabel = (status: MessageStatus) => {
    switch (status) {
      case 'copied':
        return 'Kopyalandı';
      case 'draft':
        return 'Taslak';
      case 'sent':
        return 'Gönderildi';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giden Kutusu</Text>
        <TouchableOpacity onPress={handleCopyAll} style={styles.copyAllBtn}>
          <Icon name="content-copy" size={18} color={colors.primary} />
          <Text style={styles.copyAllText}>Tümünü Kopyala</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterSpacer} />
        <Text style={styles.countLabel}>{filteredMessages.length} mesaj</Text>
      </View>

      <AppScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.keys(groupedMessages).length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="email-outline" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Mesaj bulunamadı</Text>
          </View>
        ) : (
          Object.entries(groupedMessages).map(([teamName, msgs]) => (
            <View key={teamName}>
              {Object.keys(groupedMessages).length > 1 && (
                <View style={styles.teamHeader}>
                  <Icon name="shield-half-full" size={16} color={colors.text.tertiary} />
                  <Text style={styles.teamHeaderText}>{teamName}</Text>
                </View>
              )}
              {msgs.map((msg) => (
                <View key={msg.id} style={styles.messageCard}>
                  <View style={styles.messageTop}>
                    <View style={styles.recipientRow}>
                      <Icon name="account" size={18} color={colors.text.secondary} />
                      <Text style={styles.recipientName}>{msg.recipient}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(msg.status)}20` }]}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(msg.status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(msg.status) }]}>
                        {getStatusLabel(msg.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.messageBody} numberOfLines={2}>
                    {msg.body}
                  </Text>
                  <View style={styles.messageBottom}>
                    <Text style={styles.messageDate}>{msg.createdAt}</Text>
                    <TouchableOpacity
                      style={styles.copyBtn}
                      onPress={() => handleCopy(msg)}
                      activeOpacity={0.7}
                    >
                      <Icon name="content-copy" size={16} color={colors.primary} />
                      <Text style={styles.copyBtnText}>Kopyala</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </AppScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  copyAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}18`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  copyAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary,
  },
  // Filters
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.secondary,
  },
  filterSpacer: { flex: 1 },
  countLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  // Content
  content: { flex: 1, paddingHorizontal: spacing.lg },
  scrollContent: { paddingBottom: 100 },
  // Team header
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  teamHeaderText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Message card
  messageCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  messageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recipientName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
  },
  messageBody: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  messageBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
  },
  messageDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  copyBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
});
