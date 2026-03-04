/**
 * Venue Analytics - Saha analitikleri (web ile uyumlu)
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'VenueAnalytics'>;

export default function VenueAnalyticsScreen() {
  const navigation = useNavigation<NavProp>();
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Icon name="arrow-left" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.title}>Saha Analitikleri</Text>
      <Text style={styles.subtitle}>Doluluk ve gelir ozeti (web ile senkron).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary, paddingTop: 50, padding: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: typography.fontSize.xxl, fontWeight: '800', color: colors.text.primary },
  subtitle: { marginTop: 8, fontSize: 14, color: colors.text.secondary },
});
