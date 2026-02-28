/**
 * VenueAddScreen – Yeni saha ekleme (Firestore)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { createVenue } from '../services/venues';
import { hapticLight } from '../utils/haptic';
import AlertModal from '../components/AlertModal';

type VenueAddNavProp = StackNavigationProp<RootStackParamList, 'VenueAdd'>;

const FEATURE_OPTIONS = ['Otopark', 'Duş', 'Kafe', 'Kantin', 'Havlu', 'Soğuk Oda'];

export default function VenueAddScreen() {
  const navigation = useNavigation<VenueAddNavProp>();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'error' | 'success';
  } | null>(null);

  const toggleFeature = (f: string) => {
    hapticLight();
    setSelectedFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const handleSave = async () => {
    hapticLight();
    const nameTrim = name.trim();
    const locTrim = location.trim();
    const price = parseFloat(pricePerHour.replace(',', '.'));

    if (!nameTrim) {
      setAlert({ title: 'Hata', message: 'Saha adı gerekli.', type: 'error' });
      return;
    }
    if (!locTrim) {
      setAlert({ title: 'Hata', message: 'Konum gerekli.', type: 'error' });
      return;
    }
    if (isNaN(price) || price < 0) {
      setAlert({ title: 'Hata', message: 'Geçerli bir saatlik ücret girin.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      await createVenue({
        name: nameTrim,
        location: locTrim,
        address: address.trim() || locTrim,
        pricePerHour: price,
        features: selectedFeatures,
        ownerId: user?.id,
      });
      setAlert({
        title: 'Başarılı',
        message: 'Saha eklendi.',
        type: 'success',
      });
    } catch (err) {
      console.error('Create venue error:', err);
      setAlert({
        title: 'Hata',
        message: (err as Error).message ?? 'Saha eklenemedi.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AlertModal
        visible={!!alert}
        title={alert?.title ?? ''}
        message={alert?.message ?? ''}
        type={alert?.type ?? 'info'}
        onConfirm={() => {
          setAlert(null);
          if (alert?.type === 'success') navigation.goBack();
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yeni Saha Ekle</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.label}>Saha Adı *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Örn: Olimpik Halı Saha"
            placeholderTextColor={colors.text.disabled}
          />

          <Text style={styles.label}>Konum (Semt) *</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Örn: Kadıköy"
            placeholderTextColor={colors.text.disabled}
          />

          <Text style={styles.label}>Adres (Tam adres, isteğe bağlı)</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Örn: Fenerbahçe Mah. Kalamış Cad. No:88"
            placeholderTextColor={colors.text.disabled}
          />

          <Text style={styles.label}>Saatlik Ücret (₺) *</Text>
          <TextInput
            style={styles.input}
            value={pricePerHour}
            onChangeText={setPricePerHour}
            placeholder="Örn: 1200"
            placeholderTextColor={colors.text.disabled}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Özellikler</Text>
          <View style={styles.features}>
            {FEATURE_OPTIONS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, selectedFeatures.includes(f) && styles.chipActive]}
                onPress={() => toggleFeature(f)}
              >
                <Text style={[styles.chipText, selectedFeatures.includes(f) && styles.chipTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.text.primary },
  saveBtn: { padding: spacing.sm },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.button, color: colors.primary },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 100 },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },
  features: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { ...typography.caption, color: colors.text.secondary },
  chipTextActive: { color: '#fff' },
});
