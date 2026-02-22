/**
 * Match Create Screen - Admin maç oluşturma (API + form)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { canCreateMatch } from '../utils/permissions';
import { colors, spacing, borderRadius, typography } from '../theme';
import { getVenues } from '../services/venues';
import { createMatch } from '../services/matches';
import { getTeamIdForUser } from '../services/players';
import type { Venue } from '../types';

export default function MatchCreateScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('21:00');
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [price, setPrice] = useState('120');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = canCreateMatch(user);

  useEffect(() => {
    let cancelled = false;
    getVenues().then((list) => {
      if (!cancelled) {
        setVenues(list);
        if (list.length > 0) setSelectedVenueId(list[0].id);
      }
    }).finally(() => { if (!cancelled) setLoadingVenues(false); });
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async () => {
    if (!date.trim()) {
      Alert.alert('Eksik alan', 'Lütfen tarih girin.');
      return;
    }
    if (!selectedVenueId) {
      Alert.alert('Eksik alan', 'Lütfen saha seçin.');
      return;
    }
    const priceNum = parseInt(price, 10) || 0;
    const teamId = user?.id ? await getTeamIdForUser(user.id) : undefined;
    setSubmitting(true);
    try {
      await createMatch({
        date: date.trim(),
        time: time.trim() || '21:00',
        venueId: selectedVenueId,
        teamId: teamId ?? undefined,
        pricePerPerson: priceNum || undefined,
      });
      Alert.alert('Başarılı', 'Maç oluşturuldu.');
      navigation.goBack();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Maç oluşturulamadı. API erişilemiyor olabilir.';
      Alert.alert('Hata', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Maç Oluştur</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centered}>
          <Icon name="lock" size={48} color={colors.alert} />
          <Text style={styles.lockText}>Maç oluşturmak için yönetici veya kaptan yetkisi gerekir.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Maç</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Tarih</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.text.disabled}
        />
        <Text style={styles.label}>Saat</Text>
        <TextInput
          style={styles.input}
          value={time}
          onChangeText={setTime}
          placeholder="21:00"
          placeholderTextColor={colors.text.disabled}
        />
        <Text style={styles.label}>Saha</Text>
        {loadingVenues ? (
          <View style={styles.venueLoader}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.venueLoaderText}>Sahalar yükleniyor...</Text>
          </View>
        ) : venues.length === 0 ? (
          <View style={styles.venueEmpty}>
            <Text style={styles.venueEmptyText}>Henüz saha eklenmemiş. Firestore'da venues koleksiyonuna saha ekleyin.</Text>
          </View>
        ) : (
          <View style={styles.venueList}>
            {venues.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.venueChip, selectedVenueId === v.id && styles.venueChipSelected]}
                onPress={() => setSelectedVenueId(v.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.venueChipText, selectedVenueId === v.id && styles.venueChipTextSelected]}>
                  {v.name}
                </Text>
                {v.pricePerHour > 0 && (
                  <Text style={[styles.venueChipSub, selectedVenueId === v.id && styles.venueChipTextSelected]}>
                    {v.pricePerHour} ₺/saat
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text style={styles.label}>Kişi başı (₺)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="120"
          placeholderTextColor={colors.text.disabled}
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleCreate}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.secondary} />
          ) : (
            <Text style={styles.submitBtnText}>Maç Oluştur</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  form: {
    padding: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  venueLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  venueLoaderText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  venueEmpty: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  venueEmptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  venueList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  venueChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.surface,
  },
  venueChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  venueChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  venueChipTextSelected: {
    color: colors.primary,
  },
  venueChipSub: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  submitBtnText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  lockText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});
