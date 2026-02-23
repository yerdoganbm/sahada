/**
 * Booking Screen – Rezervasyon oluşturma (Firestore)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getVenues } from '../services/venues';
import { createReservation } from '../services/finance';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'Booking'>;
type RouteProp = RouteProp<RootStackParamList, 'Booking'>;

export default function BookingScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<RouteProp>();
  const { user } = useAuth();
  const [venues, setVenues] = useState<Array<{ id: string; name: string; pricePerHour: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('20:00');
  const [endTime, setEndTime] = useState('21:00');
  const [selectedVenueId, setSelectedVenueId] = useState(params?.venueId ?? '');
  const [venueName, setVenueName] = useState(params?.venueName ?? '');

  useEffect(() => {
    let cancelled = false;
    getVenues().then((list) => {
      if (!cancelled) {
        setVenues(list.map((v) => ({ id: v.id, name: v.name, pricePerHour: v.pricePerHour })));
        if (params?.venueId && !selectedVenueId) {
          setSelectedVenueId(params.venueId);
          setVenueName(params.venueName ?? list.find((v) => v.id === params.venueId)?.name ?? '');
        } else if (list.length > 0 && !selectedVenueId) {
          setSelectedVenueId(list[0].id);
          setVenueName(list[0].name);
        }
      }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params?.venueId]);

  const handleSubmit = async () => {
    if (!date.trim() || !selectedVenueId) {
      Alert.alert('Eksik', 'Tarih ve saha seçin.');
      return;
    }
    const venue = venues.find((v) => v.id === selectedVenueId);
    setSubmitting(true);
    try {
      await createReservation({
        venueId: selectedVenueId,
        venueName: venueName || venue?.name,
        date: date.trim(),
        startTime: startTime.trim() || '20:00',
        endTime: endTime.trim() || '21:00',
        duration: 60,
        price: venue?.pricePerHour ?? 0,
        teamName: user?.name,
        contactPerson: user?.name,
        contactPhone: user?.phone,
        createdBy: user?.id,
      });
      Alert.alert('Başarılı', 'Rezervasyon talebi oluşturuldu.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Rezervasyon oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rezervasyon</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <>
            <Text style={styles.label}>Saha</Text>
            <View style={styles.venueChips}>
              {venues.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.chip, selectedVenueId === v.id && styles.chipSelected]}
                  onPress={() => { setSelectedVenueId(v.id); setVenueName(v.name); }}
                >
                  <Text style={[styles.chipText, selectedVenueId === v.id && styles.chipTextSelected]}>{v.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Tarih (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2025-02-20"
              placeholderTextColor={colors.text.disabled}
            />
            <Text style={styles.label}>Başlangıç</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="20:00"
              placeholderTextColor={colors.text.disabled}
            />
            <Text style={styles.label}>Bitiş</Text>
            <TextInput
              style={styles.input}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="21:00"
              placeholderTextColor={colors.text.disabled}
            />
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.secondary} />
              ) : (
                <Text style={styles.submitText}>Rezervasyon Talebi Gönder</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  placeholder: { width: 40 },
  content: { flex: 1 },
  contentInner: { padding: spacing.lg, paddingBottom: 100 },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text.secondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  venueChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: `${colors.primary}20` },
  chipText: { fontSize: typography.fontSize.sm, color: colors.text.primary },
  chipTextSelected: { color: colors.primary, fontWeight: '600' },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.secondary },
});
