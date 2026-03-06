/**
 * VenueLocationEditorScreen – Saha konum düzenleyici (harita benzeri)
 * Manuel lat/lng girişi ve pin tipi seçici ile placeholder harita alanı.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AppScrollView from '../components/AppScrollView';
import { colors, spacing, borderRadius, typography } from '../theme';

type PinType = 'main' | 'entrance' | 'parking' | 'meetup';

const PIN_OPTIONS: { type: PinType; label: string; icon: string; color: string }[] = [
  { type: 'main', label: 'Ana Konum', icon: 'map-marker', color: colors.primary },
  { type: 'entrance', label: 'Giriş', icon: 'door', color: '#3B82F6' },
  { type: 'parking', label: 'Otopark', icon: 'car', color: '#F59E0B' },
  { type: 'meetup', label: 'Buluşma', icon: 'account-group', color: '#8B5CF6' },
];

export default function VenueLocationEditorScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [selectedPin, setSelectedPin] = useState<PinType>('main');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!venueName.trim()) return;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    setSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    navigation.goBack();
  };

  const isValid =
    venueName.trim().length > 0 &&
    !isNaN(parseFloat(latitude)) &&
    !isNaN(parseFloat(longitude));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Konum Düzenle</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !isValid}
          style={[styles.saveBtn, (!isValid || saving) && styles.saveBtnDisabled]}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveBtnText}>Kaydet</Text>
          )}
        </TouchableOpacity>
      </View>

      <AppScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {/* Venue Name */}
        <Text style={styles.label}>Saha Adı *</Text>
        <TextInput
          style={styles.input}
          value={venueName}
          onChangeText={setVenueName}
          placeholder="Saha adını girin"
          placeholderTextColor={colors.text.disabled}
        />

        {/* Address */}
        <Text style={styles.label}>Adres</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={address}
          onChangeText={setAddress}
          placeholder="Tam adres bilgisi"
          placeholderTextColor={colors.text.disabled}
          multiline
          numberOfLines={3}
        />

        {/* Map Placeholder */}
        <Text style={styles.label}>Harita Konumu</Text>
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapGrid}>
            {/* Crosshair lines */}
            <View style={styles.mapCrosshairH} />
            <View style={styles.mapCrosshairV} />
          </View>
          <View style={styles.mapPinContainer}>
            <Icon
              name={PIN_OPTIONS.find((p) => p.type === selectedPin)?.icon || 'map-marker'}
              size={36}
              color={PIN_OPTIONS.find((p) => p.type === selectedPin)?.color || colors.primary}
            />
          </View>
          <View style={styles.mapOverlay}>
            <Icon name="map-outline" size={20} color={colors.text.tertiary} />
            <Text style={styles.mapOverlayText}>
              Koordinatları aşağıdan manuel girin
            </Text>
          </View>
        </View>

        {/* Coordinates */}
        <Text style={styles.label}>Koordinatlar *</Text>
        <View style={styles.coordRow}>
          <View style={styles.coordField}>
            <Text style={styles.coordLabel}>Enlem (Lat)</Text>
            <TextInput
              style={styles.input}
              value={latitude}
              onChangeText={setLatitude}
              placeholder="41.0082"
              placeholderTextColor={colors.text.disabled}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.coordField}>
            <Text style={styles.coordLabel}>Boylam (Lng)</Text>
            <TextInput
              style={styles.input}
              value={longitude}
              onChangeText={setLongitude}
              placeholder="28.9784"
              placeholderTextColor={colors.text.disabled}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Coordinate Display */}
        {latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude)) && (
          <View style={styles.coordDisplay}>
            <Icon name="crosshairs-gps" size={16} color={colors.primary} />
            <Text style={styles.coordDisplayText}>
              {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
            </Text>
          </View>
        )}

        {/* Pin Type Selector */}
        <Text style={styles.label}>Pin Tipi</Text>
        <View style={styles.pinGrid}>
          {PIN_OPTIONS.map((pin) => (
            <TouchableOpacity
              key={pin.type}
              style={[
                styles.pinCard,
                selectedPin === pin.type && {
                  borderColor: pin.color,
                  backgroundColor: `${pin.color}15`,
                },
              ]}
              onPress={() => setSelectedPin(pin.type)}
            >
              <View
                style={[
                  styles.pinIcon,
                  { backgroundColor: `${pin.color}20` },
                  selectedPin === pin.type && { backgroundColor: `${pin.color}30` },
                ]}
              >
                <Icon
                  name={pin.icon as any}
                  size={22}
                  color={selectedPin === pin.type ? pin.color : colors.text.tertiary}
                />
              </View>
              <Text
                style={[
                  styles.pinLabel,
                  selectedPin === pin.type && { color: pin.color },
                ]}
              >
                {pin.label}
              </Text>
              {selectedPin === pin.type && (
                <Icon name="check-circle" size={16} color={pin.color} style={styles.pinCheck} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Icon name="information-outline" size={18} color={colors.info} />
          <Text style={styles.infoText}>
            Birden fazla pin tipi ekleyerek sahanızın farklı noktalarını işaretleyebilirsiniz.
            Ziyaretçiler bu pinleri haritada görecektir.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, (!isValid || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || !isValid}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="content-save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Konumu Kaydet</Text>
            </>
          )}
        </TouchableOpacity>
      </AppScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: { fontSize: typography.fontSize.xl, fontWeight: '700', color: colors.text.primary },
  saveBtn: { padding: spacing.sm },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.primary },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 100 },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  // Map placeholder
  mapPlaceholder: {
    height: 200,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapCrosshairH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: colors.border.light,
  },
  mapCrosshairV: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: colors.border.light,
  },
  mapPinContainer: {
    zIndex: 2,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapOverlayText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  // Coordinates
  coordRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  coordField: { flex: 1 },
  coordLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  coordDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  coordDisplayText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // Pin selector
  pinGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pinCard: {
    width: '48%' as any,
    flexBasis: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    position: 'relative',
  },
  pinIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pinLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  pinCheck: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  // Info
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.info}10`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.info}25`,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  // Save button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
});
