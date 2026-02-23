/**
 * PlaceholderScreen – Geliştirme aşamasındaki ekranlar için genel gösterim
 * NOT: Gerçek implementasyonlar ilgili dosyalarda mevcuttur.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';

interface PlaceholderScreenProps {
  title?: string;
}

const PlaceholderScreen = ({ title = 'Ekran' }: PlaceholderScreenProps) => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Icon name="tools" size={56} color={colors.text.disabled} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Bu ekran geliştirme aşamasında.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default PlaceholderScreen;
