/**
 * PlayerCard — React Native player card component
 * Mirrors web components/PlayerCard.tsx
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

interface Player {
  id: string;
  name: string;
  position: string;
  rating: number;
  avatar: string;
  isCaptain?: boolean;
}

interface PlayerCardProps {
  player: Player;
  onPress?: () => void;
}

const getPositionColor = (pos: string) => {
  switch (pos) {
    case 'GK': return { bg: 'rgba(234,179,8,0.2)', text: '#eab308', border: 'rgba(234,179,8,0.2)' };
    case 'DEF': return { bg: 'rgba(59,130,246,0.2)', text: '#3b82f6', border: 'rgba(59,130,246,0.2)' };
    case 'MID': return { bg: 'rgba(34,197,94,0.2)', text: '#22c55e', border: 'rgba(34,197,94,0.2)' };
    case 'FWD': return { bg: 'rgba(239,68,68,0.2)', text: '#ef4444', border: 'rgba(239,68,68,0.2)' };
    default: return { bg: 'rgba(100,116,139,0.2)', text: '#64748b', border: 'rgba(100,116,139,0.2)' };
  }
};

export default function PlayerCard({ player, onPress }: PlayerCardProps) {
  const posColor = getPositionColor(player.position);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.card}>
      <View style={styles.avatarWrap}>
        <Image source={{ uri: player.avatar }} style={styles.avatar} />
        {player.isCaptain && (
          <View style={styles.captainBadge}>
            <Text style={styles.captainText}>K</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{player.name}</Text>
        <View style={[styles.posBadge, { backgroundColor: posColor.bg, borderColor: posColor.border }]}>
          <Text style={[styles.posText, { color: posColor.text }]}>{player.position}</Text>
        </View>
      </View>

      <View style={styles.ratingWrap}>
        <Text style={styles.rating}>{player.rating}</Text>
        <Text style={styles.ratingLabel}>Puan</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#475569' },
  captainBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#eab308', width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.surface,
  },
  captainText: { fontSize: 9, fontWeight: '700', color: '#000' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 14, fontWeight: '600', color: '#fff' },
  posBadge: {
    marginTop: 4, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1,
  },
  posText: { fontSize: 10, fontWeight: '700' },
  ratingWrap: { alignItems: 'flex-end' },
  rating: { fontSize: 14, fontWeight: '700', color: colors.primary },
  ratingLabel: { fontSize: 9, color: '#64748b', marginTop: 2 },
});
