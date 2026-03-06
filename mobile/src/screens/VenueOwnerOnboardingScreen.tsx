/**
 * VenueOwnerOnboarding – Saha sahibi kaydı (4 adım), web ile uyumlu
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import type { Player, Venue } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { hapticLight } from '../utils/haptic';

type VenueOwnerOnboardingNavProp = StackNavigationProp<RootStackParamList, 'VenueOwnerOnboarding'>;
type VenueOwnerOnboardingRouteProp = RouteProp<RootStackParamList, 'VenueOwnerOnboarding'>;

const DISTRICTS = ['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Şile', 'Şişli', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'];
const BANKS = ['Ziraat Bankası', 'İş Bankası', 'Garanti BBVA', 'Yapı Kredi', 'Akbank', 'Halkbank', 'Vakıfbank', 'Denizbank', 'TEB', 'QNB Finansbank'];
const FEATURES_LIST = [
  { id: 'parking', label: 'Otopark', icon: 'parking' as const },
  { id: 'shower', label: 'Duş & Soyunma', icon: 'shower' as const },
  { id: 'cafe', label: 'Kafe / Kantin', icon: 'coffee' as const },
  { id: 'lighting', label: 'Işıklı Saha', icon: 'lightbulb' as const },
  { id: 'tribunes', label: 'Tribün', icon: 'stadium' as const },
  { id: 'grass', label: 'Çim Zemin', icon: 'grass' as const },
  { id: 'indoor', label: 'Kapalı Alan', icon: 'domain' as const },
  { id: 'security', label: '7/24 Güvenlik', icon: 'shield-account' as const },
];
const CAPACITIES = ['5v5', '6v6', '7v7', '8v8', '11v11'];
const STEPS = [
  { label: 'Kişisel', icon: 'account' as const },
  { label: 'İşletme', icon: 'domain' as const },
  { label: 'Saha', icon: 'stadium' as const },
  { label: 'Ödeme', icon: 'bank' as const },
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  venueName: string;
  venueDistrict: string;
  venueAddress: string;
  venuePhone: string;
  venuePrice: string;
  venueCapacity: string;
  venueFeatures: string[];
  iban: string;
  bankName: string;
  accountHolder: string;
}

const defaultForm = (phone: string): FormData => ({
  firstName: '', lastName: '', email: '',
  companyName: '', taxNumber: '', taxOffice: '',
  venueName: '', venueDistrict: 'Kadıköy', venueAddress: '', venuePhone: phone,
  venuePrice: '', venueCapacity: '7v7', venueFeatures: [],
  iban: '', bankName: 'Ziraat Bankası', accountHolder: '',
});

export default function VenueOwnerOnboardingScreen() {
  const navigation = useNavigation<VenueOwnerOnboardingNavProp>();
  const route = useRoute<VenueOwnerOnboardingRouteProp>();
  const phone = route.params?.phone ?? '';

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [form, setForm] = useState<FormData>(defaultForm(phone));

  const set = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const toggleFeature = (id: string) => {
    setForm(prev => ({
      ...prev,
      venueFeatures: prev.venueFeatures.includes(id)
        ? prev.venueFeatures.filter(f => f !== id)
        : [...prev.venueFeatures, id],
    }));
  };

  const validateStep = (): boolean => {
    const errs: Partial<FormData> = {};
    if (step === 0) {
      if (!form.firstName.trim()) errs.firstName = 'Ad gerekli';
      if (!form.lastName.trim()) errs.lastName = 'Soyad gerekli';
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Geçerli e-posta girin';
    }
    if (step === 1) {
      // companyName opsiyonel — web ile uyumlu (işletme bilgisi atlanabilir)
      if (form.taxNumber && !/^\d{10}$/.test(form.taxNumber.replace(/\s/g, ''))) errs.taxNumber = 'Vergi no 10 haneli olmalı';
    }
    if (step === 2) {
      if (!form.venueName.trim()) errs.venueName = 'Saha adı gerekli';
      if (!form.venueAddress.trim()) errs.venueAddress = 'Adres gerekli';
      if (!form.venuePrice || isNaN(Number(form.venuePrice)) || Number(form.venuePrice) < 100) errs.venuePrice = 'Min. 100₺';
    }
    if (step === 3) {
      const cleanIban = form.iban.replace(/\s/g, '');
      if (!cleanIban) errs.iban = 'IBAN gerekli';
      else if (!/^TR\d{24}$/.test(cleanIban)) errs.iban = 'TR ile başlamalı, 26 karakter';
      if (!form.accountHolder.trim()) errs.accountHolder = 'Hesap sahibi adı gerekli';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    hapticLight();
    if (!validateStep()) return;
    if (step < 3) {
      setStep(s => s + 1);
      return;
    }
    handleSubmit();
  };

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      const ownerId = 'venue_owner_' + Date.now();
      const venueId = 'v_' + Date.now();
      const newOwner: Player = {
        id: ownerId,
        name: `${form.firstName} ${form.lastName}`,
        position: 'MID',
        rating: 0,
        reliability: 100,
        avatar: `https://i.pravatar.cc/150?u=${ownerId}`,
        role: 'venue_owner',
        venueOwnerInfo: {
          venueIds: [venueId],
          businessInfo: {
            companyName: form.companyName,
            taxNumber: form.taxNumber,
            iban: form.iban.replace(/\s/g, ''),
            bankName: form.bankName,
            accountHolder: form.accountHolder,
          },
          commissionRate: 15,
          totalRevenue: 0,
          totalReservations: 0,
          responseTime: 0,
        },
      };
      const newVenue: Venue = {
        id: venueId,
        name: form.venueName,
        location: form.venueAddress,
        district: form.venueDistrict,
        address: form.venueAddress,
        pricePerHour: Number(form.venuePrice),
        rating: 0,
        image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=1000&q=80',
        features: form.venueFeatures.map(f => FEATURES_LIST.find(x => x.id === f)?.label ?? f),
        phone: form.venuePhone,
        capacity: form.venueCapacity,
        status: 'pending_review',
        ownerId: ownerId,
        organizerNotes: {
          doorCode: '-',
          contactPerson: `${form.firstName} ${form.lastName}`,
          contactPhone: form.venuePhone,
          lastUpdate: new Date().toISOString(),
          customNotes: 'Yeni kayıt — onay bekleniyor.',
        },
        priceHistory: [],
      };
      setIsLoading(false);
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'VenueOwnerDashboard' }] })
      );
    }, 1500);
  };

  const formatIban = (value: string) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 26);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const inputStyle = (hasError: boolean) => [
    styles.input,
    hasError && styles.inputError,
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 0 ? setStep(s => s - 1) : navigation.goBack())} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Saha Sahibi Kaydı</Text>
          <Text style={styles.headerSubtitle}>{STEPS[step].label} — Adım {step + 1} / 4</Text>
        </View>
      </View>
      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.progressBar, i <= step && styles.progressBarActive]} />
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <View style={styles.stepBlock}>
            <Text style={styles.stepTitle}>Kişisel Bilgiler</Text>
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Ad *</Text>
                <TextInput value={form.firstName} onChangeText={v => set('firstName', v)} placeholder="Kemal" style={inputStyle(!!errors.firstName)} placeholderTextColor={colors.text.disabled} />
                {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Soyad *</Text>
                <TextInput value={form.lastName} onChangeText={v => set('lastName', v)} placeholder="Arslan" style={inputStyle(!!errors.lastName)} placeholderTextColor={colors.text.disabled} />
                {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
              </View>
            </View>
            <Text style={styles.label}>Telefon</Text>
            <View style={styles.phoneDisplay}>
              <Text style={styles.phoneDisplayText}>+90 {phone.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4')}</Text>
              <Icon name="check-circle" size={18} color="#3B82F6" />
            </View>
            <Text style={styles.label}>E-posta (opsiyonel)</Text>
            <TextInput value={form.email} onChangeText={v => set('email', v)} placeholder="ornek@email.com" keyboardType="email-address" style={inputStyle(!!errors.email)} placeholderTextColor={colors.text.disabled} />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepBlock}>
            <Text style={styles.stepTitle}>İşletme Bilgileri</Text>
            <Text style={styles.label}>Şirket / İşletme Adı *</Text>
            <TextInput value={form.companyName} onChangeText={v => set('companyName', v)} placeholder="Arslan Spor Tesisleri" style={inputStyle(!!errors.companyName)} placeholderTextColor={colors.text.disabled} />
            {errors.companyName ? <Text style={styles.errorText}>{errors.companyName}</Text> : null}
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Vergi No</Text>
                <TextInput value={form.taxNumber} onChangeText={v => set('taxNumber', v)} placeholder="1234567890" maxLength={10} keyboardType="number-pad" style={inputStyle(!!errors.taxNumber)} placeholderTextColor={colors.text.disabled} />
                {errors.taxNumber ? <Text style={styles.errorText}>{errors.taxNumber}</Text> : null}
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Vergi Dairesi</Text>
                <TextInput value={form.taxOffice} onChangeText={v => set('taxOffice', v)} placeholder="Kadıköy" style={styles.input} placeholderTextColor={colors.text.disabled} />
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepBlock}>
            <Text style={styles.stepTitle}>Saha Bilgileri</Text>
            <Text style={styles.label}>Saha Adı *</Text>
            <TextInput value={form.venueName} onChangeText={v => set('venueName', v)} placeholder="Olimpik Halı Saha" style={inputStyle(!!errors.venueName)} placeholderTextColor={colors.text.disabled} />
            {errors.venueName ? <Text style={styles.errorText}>{errors.venueName}</Text> : null}
            <Text style={styles.label}>İlçe</Text>
            <View style={styles.pickerWrap}>
              <Text style={styles.pickerText}>{form.venueDistrict}</Text>
              <Icon name="chevron-down" size={20} color={colors.text.disabled} />
            </View>
            <Text style={styles.label}>Tam Adres *</Text>
            <TextInput value={form.venueAddress} onChangeText={v => set('venueAddress', v)} placeholder="Moda Cd. No:12, Kadıköy" multiline numberOfLines={2} style={[styles.input, styles.textArea, !!errors.venueAddress && styles.inputError]} placeholderTextColor={colors.text.disabled} />
            {errors.venueAddress ? <Text style={styles.errorText}>{errors.venueAddress}</Text> : null}
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Saha Telefonu</Text>
                <TextInput value={form.venuePhone} onChangeText={v => set('venuePhone', v)} placeholder="5XX XXX XX XX" keyboardType="phone-pad" style={styles.input} placeholderTextColor={colors.text.disabled} />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Saatlik Fiyat (₺) *</Text>
                <TextInput value={form.venuePrice} onChangeText={v => set('venuePrice', v.replace(/\D/g, ''))} placeholder="1200" keyboardType="number-pad" style={inputStyle(!!errors.venuePrice)} placeholderTextColor={colors.text.disabled} />
                {errors.venuePrice ? <Text style={styles.errorText}>{errors.venuePrice}</Text> : null}
              </View>
            </View>
            <Text style={styles.label}>Saha Özellikleri</Text>
            <View style={styles.featuresGrid}>
              {FEATURES_LIST.map(f => {
                const active = form.venueFeatures.includes(f.id);
                return (
                  <TouchableOpacity key={f.id} onPress={() => toggleFeature(f.id)} style={[styles.featureChip, active && styles.featureChipActive]} activeOpacity={0.8}>
                    <Icon name={f.icon} size={16} color={active ? '#3B82F6' : colors.text.disabled} />
                    <Text style={[styles.featureChipText, active && styles.featureChipTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepBlock}>
            <Text style={styles.stepTitle}>Ödeme Bilgileri</Text>
            <Text style={styles.label}>Banka</Text>
            <View style={styles.pickerWrap}>
              <Text style={styles.pickerText}>{form.bankName}</Text>
              <Icon name="chevron-down" size={20} color={colors.text.disabled} />
            </View>
            <Text style={styles.label}>IBAN *</Text>
            <TextInput value={form.iban} onChangeText={v => set('iban', formatIban(v))} placeholder="TR33 0006 1005 1978 6457 8413 26" style={[styles.input, styles.ibanInput, !!errors.iban && styles.inputError]} placeholderTextColor={colors.text.disabled} />
            {errors.iban ? <Text style={styles.errorText}>{errors.iban}</Text> : null}
            <Text style={styles.label}>Hesap Sahibi Adı *</Text>
            <TextInput value={form.accountHolder} onChangeText={v => set('accountHolder', v)} placeholder="Kemal Arslan" style={inputStyle(!!errors.accountHolder)} placeholderTextColor={colors.text.disabled} />
            {errors.accountHolder ? <Text style={styles.errorText}>{errors.accountHolder}</Text> : null}
            <View style={styles.infoBox}>
              <Icon name="information" size={16} color="#3B82F6" />
              <Text style={styles.infoBoxText}>Komisyon %15. Ödeme haftalık. Min. 500₺.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.nextBtn, isLoading && styles.nextBtnDisabled]} onPress={handleNext} disabled={isLoading} activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.nextBtnText}>{step < 3 ? 'Devam Et' : 'Kaydı Tamamla'}</Text>
              <Icon name={step < 3 ? 'arrow-right' : 'check-circle'} size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: 50, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.light },
  backBtn: { width: 44, height: 44, justifyContent: 'center', marginRight: spacing.sm },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '800', color: colors.text.primary },
  headerSubtitle: { fontSize: 11, color: colors.text.disabled, marginTop: 2 },
  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressBarActive: { backgroundColor: '#3B82F6' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: 100 },
  stepBlock: { marginBottom: spacing.lg },
  stepTitle: { fontSize: typography.fontSize.lg, fontWeight: '800', color: colors.text.primary, marginBottom: spacing.md },
  label: { fontSize: 10, fontWeight: '700', color: colors.text.disabled, letterSpacing: 1, marginBottom: 6, marginLeft: 2 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border.light, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: typography.fontSize.md, color: colors.text.primary, marginBottom: spacing.sm },
  inputError: { borderColor: '#ef4444' },
  textArea: { minHeight: 56 },
  ibanInput: { fontVariant: ['tabular-nums'] },
  errorText: { fontSize: 10, color: '#ef4444', marginTop: -4, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  phoneDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  phoneDisplayText: { flex: 1, fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary },
  pickerWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border.light, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.md, marginBottom: spacing.sm },
  pickerText: { fontSize: typography.fontSize.md, color: colors.text.primary },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  featureChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.surface },
  featureChipActive: { borderColor: 'rgba(59,130,246,0.5)', backgroundColor: 'rgba(59,130,246,0.1)' },
  featureChipText: { fontSize: 11, color: colors.text.disabled },
  featureChipTextActive: { color: '#60A5FA', fontWeight: '600' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.sm },
  infoBoxText: { fontSize: 11, color: colors.text.secondary, flex: 1 },
  footer: { padding: spacing.md, paddingBottom: 34, borderTopWidth: 1, borderTopColor: colors.border.light, backgroundColor: colors.background.primary },
  nextBtn: { backgroundColor: '#3B82F6', borderRadius: borderRadius.lg, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  nextBtnDisabled: { opacity: 0.7 },
  nextBtnText: { color: '#fff', fontSize: typography.fontSize.lg, fontWeight: '800' },
});
