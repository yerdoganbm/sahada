/**
 * MatchCard — React Native match card component
 * Mirrors web components/MatchCard.tsx
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';

interface Match {
  id: string;
  date: string;
  time: string;
  location: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  opponent?: string;
  score?: string;
}

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
}

export default function MatchCard({ match, onPress }: MatchCardProps) {
  const isUpcoming = match.status === 'upcoming';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, isUpcoming && styles.statusDotActive]} />
          <Text style={[styles.statusText, isUpcoming && styles.statusTextActive]}>
            {isUpcoming ? 'Sıradaki Maç' : 'Tamamlandı'}
          </Text>
        </View>
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>{match.date}</Text>
        </View>
      </View>

      <View style={styles.teamsRow}>
        <View>
          <Text style={styles.teamName}>Bizim Takım</Text>
          <Text style={styles.teamSub}>Ev Sahibi</Text>
        </View>

        {isUpcoming ? (
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>{match.time}</Text>
          </View>
        ) : (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{match.score?.split('-')[0]}</Text>
            <Text style={styles.scoreSep}>:</Text>
            <Text style={styles.scoreText}>{match.score?.split('-')[1]}</Text>
          </View>
        )}

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.teamName}>{match.opponent || 'Rakip Aranıyor'}</Text>
          <Text style={styles.teamSub}>Deplasman</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.locationRow}>
          <Icon name="map-marker" size={14} color={colors.primary} />
          <Text style={styles.locationText}>{match.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#64748b' },
  statusDotActive: { backgroundColor: colors.primary },
  statusText: { fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  statusTextActive: { color: colors.primary },
  dateBadge: { backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  dateText: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' },
  teamsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  teamName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  teamSub: { fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700', marginTop: 2 },
  timeBadge: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  timeText: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'monospace' },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  scoreText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  scoreSep: { fontSize: 16, fontWeight: '700', color: '#64748b' },
  footer: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: '#94a3b8' },
});
