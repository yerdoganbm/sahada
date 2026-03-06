/**
 * Venue Incoming EFT Screen – Saha sahibine gönderilen EFT/havale girişleri
 *
 * Kaptanlar rezervasyon ödemesini EFT yöntemiyle sahaya ilettiğinde
 * dekont + tutar bilgisi burada listelenir. Saha sahibi her girişi
 * onaylayabilir veya reddedebilir.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { getVenues } from '../services/venues';
import { getVenueIncomingEfts, updateVenueEftStatus } from '../services/finance';
import type { VenueIncomingEftEntry } from '../services/finance';
import AppScrollView from '../components/AppScrollView';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'VenueIncomingEft'>;

// ─── Demo verisi (Firestore koleksiyonu boş olduğunda gösterilir) ────────────
const DEMO_ENTRIES: VenueIncomingEftEntry[] = [
  {
    id: 'demo-1',
    at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reservationId: 'res-101',
    teamId: 'team-a',
    teamName: 'Yeşiltepe FC',
    actorUserId: 'user-cap-1',
    actorName: 'Ahmet Yılmaz',
    amount: 1200,
    note: 'Cuma maçı rezervasyon ödemesi',
    proofUrl: undefined,
    status: 'pending',
  },
  {
    id: 'demo-2',
    at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    reservationId: 'res-099',
    teamId: 'team-b',
    teamName: 'Kırmızı Kartallar',
    actorUserId: 'user-cap-2',
    actorName: 'Mehmet Demir',
    amount: 900,
    note: 'Perşembe akşamı',
    proofUrl: 'https://placehold.co/400x600/png',
    status: 'pending',
  },
  {
    id: 'demo-3',
    at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    reservationId: 'res-088',
    teamId: 'team-c',
    teamName: 'Mavi Fırtına',
    actorUserId: 'user-cap-3',
    actorName: 'Can Öztürk',
    amount: 1500,
    proofUrl: 'https://placehold.co/400x600/png',
    status: 'approved',
  },
];

// ─── Yardımcı: durum renk / etiket ─────────────────────────────────────────
const STATUS_META: Record<VenueIncomingEftEntry['status'], { label: string; color: string }> = {
  pending:  { label: 'Bekliyor',  color: '#F59E0B' },
  approved: { label: 'Onaylandı', color: '#10B981' },
  rejected: { label: 'Reddedildi', color: '#EF4444' },
};

function formatRelative(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Az önce';
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

// ─── EFT Kart bileşeni ───────────────────────────────────────────────────────
function EftCard({
  entry,
  onApprove,
  onReject,
}: {
  entry: VenueIncomingEftEntry;
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
}) {
  const meta = STATUS_META[entry.status];
  const isPending = entry.status === 'pending';

  return (
    <View style={cardStyles.card}>
      {/* Üst satır: takım + zaman */}
      <View style={cardStyles.topRow}>
        <View style={cardStyles.iconWrap}>
          <Icon name="bank-transfer" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.teamName}>{entry.teamName || 'Takım'}</Text>
          <Text style={cardStyles.meta}>
            {entry.actorName ? `Kaptan: ${entry.actorName}  •  ` : ''}{formatRelative(entry.at)}
          </Text>
        </View>
        <View style={[cardStyles.statusBadge, { backgroundColor: `${meta.color}20` }]}>
          <Text style={[cardStyles.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      {/* Tutar + not */}
      <View style={cardStyles.amountRow}>
        <Text style={cardStyles.amount}>₺{entry.amount.toLocaleString('tr-TR')}</Text>
        {entry.note ? <Text style={cardStyles.note} numberOfLines={2}>{entry.note}</Text> : null}
      </View>

      {/* Dekont butonu */}
      {entry.proofUrl ? (
        <TouchableOpacity
          style={cardStyles.proofBtn}
          onPress={() => Linking.openURL(entry.proofUrl!)}
        >
          <Icon name="file-image" size={16} color={colors.primary} />
          <Text style={cardStyles.proofBtnText}>Dekontu Görüntüle</Text>
        </TouchableOpacity>
      ) : (
        <View style={cardStyles.noProof}>
          <Icon name="image-off" size={14} color={colors.text.tertiary} />
          <Text style={cardStyles.noProofText}>Dekont henüz yüklenmedi</Text>
        </View>
      )}

      {/* Onay / Red butonları (sadece bekleyenler için) */}
      {isPending && (
        <View style={cardStyles.actions}>
          <TouchableOpacity
            style={[cardStyles.actionBtn, cardStyles.rejectBtn]}
            onPress={() => onReject(entry.id)}
          >
            <Icon name="close-circle-outline" size={16} color="#EF4444" />
            <Text style={[cardStyles.actionText, { color: '#EF4444' }]}>Reddet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[cardStyles.actionBtn, cardStyles.approveBtn]}
            onPress={() => onApprove(entry.id)}
          >
            <Icon name="check-circle-outline" size={16} color="#10B981" />
            <Text style={[cardStyles.actionText, { color: '#10B981' }]}>Onayla</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary}18`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamName: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary },
  meta: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: 2 },
  statusBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  amount: { fontSize: 22, fontWeight: '800', color: colors.text.primary },
  note: { flex: 1, fontSize: typography.fontSize.xs, color: colors.text.secondary },
  proofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  proofBtnText: { fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: '600' },
  noProof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  noProofText: { fontSize: typography.fontSize.xs, color: colors.text.tertiary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  approveBtn: { backgroundColor: '#10B98112', borderColor: '#10B98140' },
  rejectBtn:  { backgroundColor: '#EF444412', borderColor: '#EF444440' },
  actionText: { fontSize: typography.fontSize.sm, fontWeight: '700' },
});

// ─── Ana ekran ───────────────────────────────────────────────────────────────
export default function VenueIncomingEftScreen() {
  const navigation = useNavigation<NavProp>();
  const [entries, setEntries] = useState<VenueIncomingEftEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const fetchData = useCallback(async () => {
    try {
      const venues = await getVenues();
      const venueId = venues[0]?.id ?? '';
      const list = venueId ? await getVenueIncomingEfts(venueId) : [];
      setEntries(list.length > 0 ? list : DEMO_ENTRIES);
    } catch {
      setEntries(DEMO_ENTRIES);
    }
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

  const handleApprove = useCallback(async (id: string) => {
    Alert.alert('EFT Onayla', 'Bu ödemeyi onaylamak istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Onayla',
        onPress: async () => {
          setUpdatingId(id);
          try {
            await updateVenueEftStatus(id, 'approved');
            setEntries((prev) =>
              prev.map((e) => (e.id === id ? { ...e, status: 'approved' } : e))
            );
          } catch {
            Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
          } finally {
            setUpdatingId(null);
          }
        },
      },
    ]);
  }, []);

  const handleReject = useCallback(async (id: string) => {
    Alert.alert('EFT Reddet', 'Bu ödemeyi reddetmek istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Reddet',
        style: 'destructive',
        onPress: async () => {
          setUpdatingId(id);
          try {
            await updateVenueEftStatus(id, 'rejected');
            setEntries((prev) =>
              prev.map((e) => (e.id === id ? { ...e, status: 'rejected' } : e))
            );
          } catch {
            Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
          } finally {
            setUpdatingId(null);
          }
        },
      },
    ]);
  }, []);

  const filtered = filter === 'all'
    ? entries
    : entries.filter((e) => e.status === filter);

  const pendingCount = entries.filter((e) => e.status === 'pending').length;
  const totalPending = entries
    .filter((e) => e.status === 'pending')
    .reduce((s, e) => s + e.amount, 0);
  const totalApproved = entries
    .filter((e) => e.status === 'approved')
    .reduce((s, e) => s + e.amount, 0);

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Gelen EFT / Havale</Text>
          <Text style={styles.headerSub}>Kaptanlardan sahaya gönderilen transferler</Text>
        </View>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Icon name="clock-alert" size={20} color="#F59E0B" />
          <Text style={styles.summaryLabel}>Bekleyen</Text>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
            ₺{totalPending.toLocaleString('tr-TR')}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Icon name="check-circle" size={20} color="#10B981" />
          <Text style={styles.summaryLabel}>Onaylanan</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>
            ₺{totalApproved.toLocaleString('tr-TR')}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Icon name="bank-transfer" size={20} color={colors.primary} />
          <Text style={styles.summaryLabel}>Toplam Giriş</Text>
          <Text style={styles.summaryValue}>{entries.length}</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'approved'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekleyen' : 'Onaylanan'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <AppScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {updatingId && (
          <View style={styles.updatingBanner}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.updatingText}>Güncelleniyor...</Text>
          </View>
        )}

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="bank-transfer" size={52} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>EFT transferi yok</Text>
            <Text style={styles.emptyDesc}>
              Kaptanlar EFT ile ödeme yaptığında buraya düşecek.
            </Text>
          </View>
        ) : (
          filtered.map((entry) => (
            <EftCard
              key={entry.id}
              entry={entry}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))
        )}
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
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '800', color: colors.text.primary },
  headerSub: { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  pendingBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  pendingBadgeText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: 0,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  summaryLabel: { fontSize: 10, color: colors.text.secondary, marginTop: 4 },
  summaryValue: { fontSize: typography.fontSize.md, fontWeight: '800', color: colors.text.primary, marginTop: 2 },
  // Filter
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterBtnActive: { backgroundColor: `${colors.primary}18`, borderColor: colors.primary },
  filterText: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.text.secondary },
  filterTextActive: { color: colors.primary },
  // Content
  content: { flex: 1 },
  contentInner: { padding: spacing.lg, paddingBottom: 100 },
  updatingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.primary}12`,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  updatingText: { fontSize: typography.fontSize.xs, color: colors.primary },
  // Empty state
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary, marginTop: spacing.md },
  emptyDesc: { fontSize: typography.fontSize.sm, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
});
