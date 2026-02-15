/**
 * Matches Screen - List of all matches
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type MatchesNavigationProp = StackNavigationProp<RootStackParamList>;

const MOCK_MATCHES = [
  {
    id: 'm1',
    date: '2026-02-20',
    time: '20:00',
    location: 'Şehir Stadı',
    status: 'upcoming',
  },
  {
    id: 'm2',
    date: '2026-02-18',
    time: '19:00',
    location: 'Merkez Saha',
    status: 'completed',
    score: '5-3',
  },
];

export default function MatchesScreen() {
  const navigation = useNavigation<MatchesNavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Maçlar</Text>
      </View>

      <FlatList
        data={MOCK_MATCHES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.matchCard}
            onPress={() => navigation.navigate('MatchDetails', { matchId: item.id })}
          >
            <View style={styles.matchDate}>
              <Icon name="calendar" size={16} color={colors.primary} />
              <Text style={styles.matchDateText}>{item.date}</Text>
            </View>
            <Text style={styles.matchTime}>{item.time}</Text>
            <Text style={styles.matchLocation}>{item.location}</Text>
            {item.score && (
              <Text style={styles.matchScore}>{item.score}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  list: {
    padding: spacing.lg,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  matchDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  matchDateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  matchTime: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  matchLocation: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  matchScore: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.sm,
  },
});
