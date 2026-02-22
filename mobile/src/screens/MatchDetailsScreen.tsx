/**
 * Match Details Screen - Maç detayı, RSVP, kadro özeti (API + fallback)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { RsvpStatus } from '../types';
import { getMatch, updateMatchRSVP } from '../services/matches';
import { getPlayers } from '../services/players';
import { hapticLight } from '../utils/haptic';
import type { Match } from '../types';
import type { Player } from '../types';

type MatchDetailsRouteProp = RouteProp<RootStackParamList, 'MatchDetails'>;

const FALLBACK_MATCH: Match = {
  id: 'm1',
  date: new Date().toISOString().slice(0, 10),
  time: '20:00',
  location: 'Olimpik Halı Saha',
  venue: 'Olimpik Halı Saha',
  status: 'upcoming',
};

type SquadItem = { id: string; name: string; position: string; avatar: string; status?: 'YES' | 'NO' | 'MAYBE' };

const MOCK_SQUAD: SquadItem[] = [
  { id: '1', name: 'Ahmet Y.', position: 'MID', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: 'Mehmet D.', position: 'FWD', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: '7', name: 'Burak Y.', position: 'FWD', avatar: 'https://i.pravatar.cc/150?u=7' },
];

function formatMatchDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
  });
}

export default function MatchDetailsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<MatchDetailsRouteProp>();
  const { user } = useAuth();
  const matchId = params?.matchId || 'm1';
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvp, setRsvp] = useState<RsvpStatus>('pending');
  const [rsvpSending, setRsvpSending] = useState(false);
  const [squadList, setSquadList] = useState<SquadItem[]>(MOCK_SQUAD);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMatch(matchId).then((m) => {
      if (!cancelled) setMatch(m ?? { ...FALLBACK_MATCH, id: matchId });
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [matchId]);

  const displayMatch = match ?? FALLBACK_MATCH;

  useEffect(() => {
    let cancelled = false;
    getPlayers().then((players: Player[]) => {
      if (cancelled) return;
      if (displayMatch.attendees?.length && players.length > 0) {
        const map = new Map(players.map((p) => [p.id, p]));
        const list: SquadItem[] = displayMatch.attendees.map((a) => {
          const p = map.get(a.playerId);
          return p
            ? { id: p.id, name: p.name, position: p.position, avatar: p.avatar || `https://i.pravatar.cc/150?u=${p.id}`, status: a.status }
            : { id: a.playerId, name: 'Oyuncu', position: '-', avatar: `https://i.pravatar.cc/150?u=${a.playerId}`, status: a.status };
        });
        setSquadList(list.length > 0 ? list : MOCK_SQUAD);
      } else if (players.length > 0) {
        setSquadList(players.slice(0, 8).map((p) => ({ id: p.id, name: p.name, position: p.position, avatar: p.avatar || `https://i.pravatar.cc/150?u=${p.id}` })));
      }
    });
    return () => { cancelled = true; };
  }, [displayMatch.attendees, displayMatch.id]);

  // API'den gelen kadroda kullanıcının RSVP durumunu başlat
  useEffect(() => {
    if (!user?.id || !displayMatch.attendees?.length) return;
    const myRsvp = displayMatch.attendees.find((a) => a.playerId === user.id);
    if (myRsvp) {
      const status = myRsvp.status === 'YES' ? 'yes' : myRsvp.status === 'NO' ? 'no' : 'maybe';
      setRsvp(status as RsvpStatus);
    }
  }, [displayMatch.attendees, user?.id]);

  const rsvpOptions: { value: RsvpStatus; label: string; icon: string }[] = [
    { value: 'yes', label: 'Geliyorum', icon: 'check-circle' },
    { value: 'no', label: 'Gelmiyorum', icon: 'close-circle' },
    { value: 'maybe', label: 'Belki', icon: 'help-circle' },
  ];

  const handleRsvp = async (value: RsvpStatus) => {
    if (value === 'pending') return;
    hapticLight();
    setRsvp(value);
    if (!user?.id) return;
    setRsvpSending(true);
    try {
      await updateMatchRSVP(matchId, user.id, value as 'yes' | 'no' | 'maybe');
    } catch (e) {
      // API kapalıysa sessizce kalır; isteğe bağlı Alert
    } finally {
      setRsvpSending(false);
    }
  };

  if (loading && !match) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Maç bilgisi yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Geri"
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Maç Detayı</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            hapticLight();
            const msg = `${formatMatchDate(displayMatch.date)} ${displayMatch.time} - ${displayMatch.venue || displayMatch.location || 'Saha'}. Sahada ile takip et.`;
            Share.share({ message: msg, title: 'Maç daveti' });
          }}
          accessibilityLabel="Maçı paylaş"
          accessibilityRole="button"
        >
          <Icon name="share-variant" size={22} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.dateRow}>
          <Icon name="calendar" size={18} color={colors.primary} />
          <Text style={styles.dateText}>{formatMatchDate(displayMatch.date)} • {displayMatch.time}</Text>
        </View>
        <Text style={styles.location}>{displayMatch.venue || displayMatch.location}</Text>
        {displayMatch.status === 'completed' && displayMatch.score && (
          <Text style={styles.score}>{displayMatch.score}</Text>
        )}
        {displayMatch.status === 'upcoming' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Yaklaşan</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Katılım</Text>
      <View style={styles.rsvpRow}>
        {rsvpOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.rsvpBtn, rsvp === opt.value && styles.rsvpBtnActive]}
            onPress={() => handleRsvp(opt.value)}
            disabled={rsvpSending}
            accessibilityLabel={opt.label}
            accessibilityRole="button"
          >
            <Icon
              name={opt.icon}
              size={22}
              color={rsvp === opt.value ? colors.secondary : colors.text.secondary}
            />
            <Text
              style={[
                styles.rsvpBtnText,
                rsvp === opt.value && styles.rsvpBtnTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Kadro</Text>
      <View style={styles.squadCard}>
        {squadList.map((p) => (
          <View key={p.id} style={styles.squadRow}>
            <Image source={{ uri: p.avatar }} style={styles.squadAvatar} />
            <View style={styles.squadInfo}>
              <Text style={styles.squadName}>{p.name}</Text>
              <Text style={styles.squadPos}>
                {p.position}
                {p.status === 'YES' && ' • Geliyorum'}
                {p.status === 'NO' && ' • Gelmiyorum'}
                {p.status === 'MAYBE' && ' • Belki'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  placeholder: { width: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  location: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  score: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
  },
  rsvpRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  rsvpBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rsvpBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  rsvpBtnTextActive: {
    color: colors.secondary,
  },
  squadCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  squadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  squadAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  squadInfo: { flex: 1 },
  squadName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  squadPos: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});
