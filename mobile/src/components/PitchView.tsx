/**
 * PitchView — React Native pitch/field visualization
 * Mirrors web components/PitchView.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { colors } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const PITCH_W = SCREEN_W - 32;
const PITCH_H = PITCH_W * 0.65;

interface PlayerSlot {
  id: string;
  name: string;
  position: string;
  avatar?: string;
  shirtNumber?: number;
}

interface PitchViewProps {
  players: PlayerSlot[];
  formation?: string;
}

const FORMATION_MAP: Record<string, number[][]> = {
  '4-3-3': [
    [{ x: 50, y: 90 }],                    // GK
    [{ x: 15, y: 70 }, { x: 38, y: 70 }, { x: 62, y: 70 }, { x: 85, y: 70 }], // DEF
    [{ x: 25, y: 45 }, { x: 50, y: 45 }, { x: 75, y: 45 }],                     // MID
    [{ x: 20, y: 20 }, { x: 50, y: 15 }, { x: 80, y: 20 }],                     // FWD
  ].flat() as any,
};

export default function PitchView({ players, formation = '4-3-3' }: PitchViewProps) {
  const slots = players.slice(0, 11);

  return (
    <View style={styles.pitch}>
      {/* Field markings */}
      <View style={styles.centerLine} />
      <View style={styles.centerCircle} />
      <View style={styles.goalAreaTop} />
      <View style={styles.goalAreaBottom} />

      {/* Players */}
      {slots.map((p, i) => {
        const pos = (FORMATION_MAP[formation] || FORMATION_MAP['4-3-3'])?.[i] || { x: 50, y: 50 };
        return (
          <View key={p.id} style={[styles.playerDot, { left: `${(pos as any).x}%`, top: `${(pos as any).y}%` }]}>
            {p.avatar ? (
              <Image source={{ uri: p.avatar }} style={styles.playerAvatar} />
            ) : (
              <View style={styles.playerFallback}>
                <Text style={styles.playerNumber}>{p.shirtNumber || i + 1}</Text>
              </View>
            )}
            <Text style={styles.playerName} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pitch: {
    width: PITCH_W, height: PITCH_H, borderRadius: 12,
    backgroundColor: '#0d5a2e', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
    position: 'relative', overflow: 'hidden', alignSelf: 'center',
  },
  centerLine: { position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  centerCircle: { position: 'absolute', top: '50%', left: '50%', width: 60, height: 60, borderRadius: 30, marginLeft: -30, marginTop: -30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  goalAreaTop: { position: 'absolute', top: 0, left: '30%', width: '40%', height: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderTopWidth: 0 },
  goalAreaBottom: { position: 'absolute', bottom: 0, left: '30%', width: '40%', height: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderBottomWidth: 0 },
  playerDot: { position: 'absolute', alignItems: 'center', marginLeft: -16, marginTop: -16 },
  playerAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#fff' },
  playerFallback: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  playerNumber: { fontSize: 10, fontWeight: '800', color: '#fff' },
  playerName: { fontSize: 8, color: '#fff', fontWeight: '600', marginTop: 2, maxWidth: 50, textAlign: 'center' },
});
