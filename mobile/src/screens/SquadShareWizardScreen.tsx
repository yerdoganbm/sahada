/**
 * Squad Share Wizard – Kadro paylaşım sihirbazı + WhatsApp şablonları
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getMatches } from '../services/matches';
import { getPlayers, getTeamIdForUser } from '../services/players';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { hapticLight } from '../utils/haptic';

type NavProp = StackNavigationProp<RootStackParamList, 'SquadShareWizard'>;

// ─────────────────────────────────────────
// WhatsApp gönderici
// ─────────────────────────────────────────
async function sendWhatsApp(message: string) {
  const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    Share.share({ message, title: 'Kadro Paylaşımı' });
    return;
  }
  Linking.openURL(url);
}

// ─────────────────────────────────────────
// Template builders
// ─────────────────────────────────────────
type MatchItem = Awaited<ReturnType<typeof getMatches>>[0];
type PlayerItem = Awaited<ReturnType<typeof getPlayers>>[0];

function buildMatchSquadMessage(match: MatchItem, players: PlayerItem[]): string {
  const dateStr = new Date(match.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  const lines = players.slice(0, 14).map((p, i) => `${i + 1}. ${p.name} (${p.position})`);
  return (
    `⚽ *MAÇ KADROSU*\n\n` +
    `📅 ${dateStr} ${match.time}\n` +
    `📍 ${match.venue || match.location}\n\n` +
    `👥 *Kadro (${lines.length} oyuncu):*\n` +
    lines.join('\n') +
    `\n\n📱 _Sahada Uygulaması_`
  );
}

function buildFullRosterMessage(players: PlayerItem[]): string {
  const byPos: Record<string, PlayerItem[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) {
    byPos[p.position]?.push(p);
  }
  const sections = Object.entries(byPos)
    .filter(([, arr]) => arr.length > 0)
    .map(([pos, arr]) => {
      const icon = pos === 'GK' ? '🥅' : pos === 'DEF' ? '🛡️' : pos === 'MID' ? '🔄' : '⚡';
      return `${icon} *${pos}*\n${arr.map((p, i) => `  ${i + 1}. ${p.name}`).join('\n')}`;
    });
  return `📋 *TAKIM KADROSU* (${players.length} oyuncu)\n\n${sections.join('\n\n')}\n\n📱 _Sahada Uygulaması_`;
}

function buildMatchReminderMessage(match: MatchItem): string {
  const dateStr = new Date(match.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    `⚽ *MAÇ HATIRLATMASI*\n\n` +
    `📅 ${dateStr}\n` +
    `🕗 Saat: ${match.time}\n` +
    `📍 ${match.venue || match.location}\n\n` +
    `✅ Geleceksen *EVET*, ❌ gelmeyeceksen *HAYIR* yaz!\n` +
    `⏰ Lütfen zamanında ol!\n\n` +
    `📱 _Sahada Uygulaması_`
  );
}

function buildMatchResultMessage(match: MatchItem, score: string): string {
  const dateStr = new Date(match.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  return (
    `🏆 *MAÇ SONUCU*\n\n` +
    `⚽ ${score}\n` +
    `📅 ${dateStr} • ${match.venue || match.location}\n\n` +
    `Tebrikler ekip! Harika bir maçtı! 🎉\n\n` +
    `📱 _Sahada Uygulaması_`
  );
}

const SHARE_CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', color: '#25D366' },
  { id: 'share', label: 'Paylaş', icon: 'share-variant', color: colors.primary },
];

export default function SquadShareWizardScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [players, setPlayers] = useState<PlayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [shareChannel, setShareChannel] = useState<'whatsapp' | 'share'>('whatsapp');

  const fetchData = useCallback(async () => {
    const teamId = user?.id ? await getTeamIdForUser(user.id) : undefined;
    const [mList, pList] = await Promise.all([
      getMatches(teamId ? { teamId } : undefined),
      getPlayers(teamId ? { teamId } : undefined),
    ]);
    const upcoming = mList.filter((m) => m.status === 'upcoming' && m.date >= new Date().toISOString().slice(0, 10));
    const all = mList.filter((m) => m.date >= new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10));
    setMatches(all);
    setPlayers(pList);
    if (upcoming.length > 0) setSelectedMatch(upcoming[0]);
    else if (all.length > 0) setSelectedMatch(all[0]);
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

  const doShare = async (message: string) => {
    hapticLight();
    if (shareChannel === 'whatsapp') {
      await sendWhatsApp(message);
    } else {
      Share.share({ message, title: 'Sahada' });
    }
  };

  const templates = selectedMatch
    ? [
        {
          id: 'squad',
          title: 'Maç Kadrosu',
          icon: 'account-group',
          color: '#3B82F6',
          desc: `${players.slice(0, 14).length} oyuncu listesi`,
          message: () => buildMatchSquadMessage(selectedMatch, players),
        },
        {
          id: 'reminder',
          title: 'Maç Hatırlatması',
          icon: 'bell-ring',
          color: '#F59E0B',
          desc: `${selectedMatch.date} ${selectedMatch.time}`,
          message: () => buildMatchReminderMessage(selectedMatch),
        },
        {
          id: 'result',
          title: 'Maç Sonucu',
          icon: 'trophy',
          color: '#8B5CF6',
          desc: selectedMatch.score || 'Skor eklemek için dokunun',
          message: () => buildMatchResultMessage(selectedMatch, selectedMatch.score || '- : -'),
        },
      ]
    : [];

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
        <Text style={styles.headerTitle}>Kadro Paylaşım</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Share Channel */}
        <Text style={styles.sectionLabel}>PAYLAŞIM KANALİ</Text>
        <View style={styles.channelRow}>
          {SHARE_CHANNELS.map((ch) => (
            <TouchableOpacity
              key={ch.id}
              style={[styles.channelBtn, shareChannel === ch.id && styles.channelBtnActive]}
              onPress={() => setShareChannel(ch.id as 'whatsapp' | 'share')}
            >
              <Icon name={ch.icon as any} size={22} color={shareChannel === ch.id ? ch.color : colors.text.secondary} />
              <Text style={[styles.channelText, shareChannel === ch.id && { color: ch.color }]}>{ch.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Match Selector */}
        <Text style={styles.sectionLabel}>MAÇ SEÇ</Text>
        {matches.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Maç bulunamadı</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
            {matches.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.matchChip, selectedMatch?.id === m.id && styles.matchChipActive]}
                onPress={() => setSelectedMatch(m)}
              >
                <Text style={[styles.matchChipDate, selectedMatch?.id === m.id && { color: '#fff' }]}>{m.date}</Text>
                <Text style={[styles.matchChipVenue, selectedMatch?.id === m.id && { color: 'rgba(255,255,255,0.7)' }]} numberOfLines={1}>
                  {m.venue || m.location}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Match Templates */}
        {selectedMatch && templates.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>MAÇ ŞABLONLARI</Text>
            {templates.map((t) => (
              <View key={t.id} style={styles.templateCard}>
                <View style={styles.templateTop}>
                  <View style={[styles.templateIcon, { backgroundColor: `${t.color}18` }]}>
                    <Icon name={t.icon as any} size={24} color={t.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.templateTitle}>{t.title}</Text>
                    <Text style={styles.templateDesc}>{t.desc}</Text>
                  </View>
                </View>
                <View style={styles.templatePreviewBox}>
                  <Text style={styles.templatePreviewText} numberOfLines={3}>
                    {t.message().replace(/\*/g, '').replace(/\n/g, ' ')}
                  </Text>
                </View>
                <TouchableOpacity style={[styles.shareBtn, { backgroundColor: t.color }]} onPress={() => doShare(t.message())}>
                  <Icon
                    name={shareChannel === 'whatsapp' ? 'whatsapp' : 'share-variant'}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.shareBtnText}>
                    {shareChannel === 'whatsapp' ? 'WhatsApp\'ta Gönder' : 'Paylaş'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Full Roster */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>GENEL ŞABLONLAR</Text>
        <TouchableOpacity style={styles.generalCard} onPress={() => doShare(buildFullRosterMessage(players))}>
          <View style={[styles.templateIcon, { backgroundColor: `${colors.primary}18` }]}>
            <Icon name="account-group" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.templateTitle}>Tüm Takım Kadrosu</Text>
            <Text style={styles.templateDesc}>{players.length} oyuncu, pozisyona göre gruplu</Text>
          </View>
          <Icon name={shareChannel === 'whatsapp' ? 'whatsapp' : 'share-variant'} size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.generalCard}
          onPress={() => doShare(
            `🏟️ *SAHADA TAKIM UYGULAMASI*\n\nTakımımızı yönetmek için Sahada\'yı kullanıyoruz.\n\nMaç takvimi, kadro, ödemeler ve çok daha fazlası için indir!\n\n📱 Sahada App`
          )}
        >
          <View style={[styles.templateIcon, { backgroundColor: '#EC489918' }]}>
            <Icon name="cellphone" size={24} color="#EC4899" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.templateTitle}>Uygulama Davet Linki</Text>
            <Text style={styles.templateDesc}>Yeni üyeler için uygulama daveti</Text>
          </View>
          <Icon name={shareChannel === 'whatsapp' ? 'whatsapp' : 'share-variant'} size={20} color={colors.primary} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.text.secondary },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border.light,
  },
  backBtn: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: typography.fontSize.xl, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  content: { flex: 1 },
  contentInner: { padding: spacing.lg, paddingBottom: 100 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.text.tertiary, letterSpacing: 1.5, marginBottom: spacing.md },
  // Channel
  channelRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  channelBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border.light },
  channelBtnActive: { borderWidth: 2, borderColor: '#25D366', backgroundColor: 'rgba(37,211,102,0.08)' },
  channelText: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.text.secondary },
  // Match chips
  empty: { padding: spacing.lg },
  emptyText: { color: colors.text.secondary },
  matchChip: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border.light, minWidth: 130 },
  matchChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  matchChipDate: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.text.primary },
  matchChipVenue: { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  // Templates
  templateCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border.light },
  templateTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  templateIcon: { width: 48, height: 48, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  templateTitle: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary },
  templateDesc: { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  templatePreviewBox: { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.sm },
  templatePreviewText: { fontSize: typography.fontSize.xs, color: colors.text.secondary, lineHeight: 16 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: borderRadius.lg, paddingVertical: spacing.sm },
  shareBtnText: { fontSize: typography.fontSize.sm, fontWeight: '700', color: '#fff' },
  // General
  generalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border.light, gap: spacing.md },
});
