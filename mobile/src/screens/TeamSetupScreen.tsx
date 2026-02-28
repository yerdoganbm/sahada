/**
 * Team Setup Screen - Takım kurulumu (adım adım)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AppScrollView from '../components/AppScrollView';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { TeamProfile } from '../types';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { hapticLight } from '../utils/haptic';
import AlertModal from '../components/AlertModal';

type TeamSetupRoute = RouteProp<RootStackParamList, 'TeamSetup'>;

const COLOR_OPTIONS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function TeamSetupScreen() {
  const navigation = useNavigation();
  const route = useRoute<TeamSetupRoute>();
  const { createTeamAndLogin } = useAuth();
  const prefillPhone = route.params?.prefillPhone ?? '';
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [founderName, setFounderName] = useState('');
  const [founderEmail, setFounderEmail] = useState('');
  const [founderPhone, setFounderPhone] = useState(prefillPhone);
  const [primaryColor, setPrimaryColor] = useState(COLOR_OPTIONS[0]);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type?: 'info' | 'error' | 'warning' } | null>(null);

  useEffect(() => {
    if (prefillPhone) setFounderPhone(prefillPhone);
  }, [prefillPhone]);

  const inviteCode = (shortName || name.slice(0, 3).toUpperCase()) + '-' + new Date().getFullYear();

  const handleNext = async () => {
    hapticLight();
    const canNextStep1 = step === 1 && name.trim().length >= 2;
    const canNextStep2 = step === 2 && founderName.trim().length >= 2;
    const canNextStep3 = step === 3;

    if (step === 1) {
      if (!canNextStep1) {
        setInlineError('Takım adı en az 2 karakter olmalı');
        return;
      }
      setInlineError(null);
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!canNextStep2) {
        setInlineError('Kurucu adı en az 2 karakter olmalı');
        return;
      }
      setInlineError(null);
      setStep(3);
      return;
    }

    // Step 3: validate founder phone and optional email before submit
    const phoneTrim = founderPhone.trim();
    if (!phoneTrim || phoneTrim.length < 10) {
      setInlineError('Kurucu telefon numarası 10 haneli olmalıdır (5 ile başlayan).');
      return;
    }
    if (phoneTrim.length > 10 || !/^5[0-9]{9}$/.test(phoneTrim)) {
      setInlineError('Telefon numarası 5 ile başlayan 10 haneli olmalıdır (örn: 532 123 45 67).');
      return;
    }
    const emailTrim = founderEmail.trim();
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setInlineError('Lütfen geçerli bir e-posta adresi girin veya boş bırakın.');
      return;
    }
    setInlineError(null);

    const team: TeamProfile = {
      id: `team_${Date.now()}`,
      name: name.trim(),
      shortName: shortName.trim() || name.slice(0, 3).toUpperCase(),
      inviteCode,
      colors: [primaryColor, colors.secondary],
      founderName: founderName.trim(),
      founderEmail: emailTrim || undefined,
      foundedDate: new Date().toISOString().split('T')[0],
    };

    setLoading(true);
    try {
      await createTeamAndLogin(team, founderName.trim(), emailTrim || undefined, phoneTrim);
    } catch (err) {
      console.error('Team setup error:', err);
      setAlert({
        title: 'Hata',
        message: err instanceof Error ? err.message : 'Takım kurulurken bir hata oluştu. Lütfen tekrar deneyin.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    hapticLight();
    setInlineError(null);
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  const canNext =
    (step === 1 && name.trim().length >= 2) ||
    (step === 2 && founderName.trim().length >= 2) ||
    step === 3;

  return (
    <>
    <AlertModal
      visible={!!alert}
      title={alert?.title ?? ''}
      message={alert?.message ?? ''}
      type={alert?.type ?? 'error'}
      confirmText="Tamam"
      onConfirm={() => setAlert(null)}
    />
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityLabel="Geri"
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.progress}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[styles.progressDot, step >= s && styles.progressDotActive]}
            />
          ))}
        </View>
        <View style={styles.placeholder} />
      </View>

      <AppScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconWrap}>
          <Icon
            name={step === 1 ? 'soccer' : step === 2 ? 'account' : 'palette'}
            size={40}
            color="#FFF"
          />
        </View>
        <Text style={styles.title}>
          {step === 1 ? 'Takımını Kur' : step === 2 ? 'Kurucu Bilgileri' : 'Renk Seç'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 1
            ? 'Takım adı ve kısaltma'
            : step === 2
            ? 'Kurucu adı ve e-posta'
            : 'Takım rengi'}
        </Text>

        {step === 1 && (
          <View style={styles.form}>
            <Text style={styles.label}>Takım Adı *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(t) => { setName(t); setInlineError(null); }}
              placeholder="Örn: Kuzey Yıldızları"
              placeholderTextColor={colors.text.disabled}
              autoCapitalize="words"
              maxLength={60}
              accessibilityLabel="Takım adı"
            />
            <Text style={styles.label}>Kısaltma (3 harf)</Text>
            <TextInput
              style={[styles.input, styles.inputShort]}
              value={shortName}
              onChangeText={(t) => setShortName(t.toUpperCase().slice(0, 3))}
              placeholder="Örn: KZY"
              placeholderTextColor={colors.text.disabled}
              maxLength={3}
              accessibilityLabel="Takım kısaltması"
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.form}>
            <Text style={styles.label}>Adın Soyadın *</Text>
            <TextInput
              style={styles.input}
              value={founderName}
              onChangeText={(t) => { setFounderName(t); setInlineError(null); }}
              placeholder="Örn: Ahmet Yılmaz"
              placeholderTextColor={colors.text.disabled}
              autoCapitalize="words"
              editable={!loading}
              accessibilityLabel="Kurucu adı soyadı"
            />
            <Text style={styles.label}>Telefon *</Text>
            <View style={styles.phoneInputWrapper}>
              <Text style={styles.countryCode}>+90</Text>
              <TextInput
                style={styles.inputPhone}
                value={founderPhone}
                onChangeText={(t) => {
                  const d = t.replace(/\D/g, '');
                  const noLeadingZero = d.startsWith('0') ? d.slice(1) : d;
                  setFounderPhone(noLeadingZero.slice(0, 10));
                  setInlineError(null);
                }}
                placeholder="5XX XXX XX XX"
                placeholderTextColor={colors.text.disabled}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!loading}
                accessibilityLabel="Kurucu telefon numarası"
              />
            </View>
            <Text style={styles.label}>E-posta (opsiyonel)</Text>
            <TextInput
              style={styles.input}
              value={founderEmail}
              onChangeText={(t) => { setFounderEmail(t); setInlineError(null); }}
              placeholder="ahmet@example.com"
              placeholderTextColor={colors.text.disabled}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              accessibilityLabel="Kurucu e-posta"
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setPrimaryColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  primaryColor === c && styles.colorDotSelected,
                ]}
              >
                {primaryColor === c && (
                  <Icon name="check" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {inlineError ? (
          <Text style={styles.inlineError}>{inlineError}</Text>
        ) : null}
        <TouchableOpacity
          style={[
            styles.nextBtn,
            (!canNext && step !== 3) && styles.nextBtnDisabled,
            loading && styles.nextBtnDisabled,
          ]}
          onPress={handleNext}
          disabled={loading}
          accessibilityLabel={step === 3 ? 'Tamamla' : 'Devam'}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color={colors.secondary} />
          ) : (
            <>
              <Text style={styles.nextBtnText}>
                {step === 3 ? 'Tamamla' : 'Devam'}
              </Text>
              <Icon name="arrow-right" size={20} color={colors.secondary} />
            </>
          )}
        </TouchableOpacity>
      </AppScrollView>
    </KeyboardAvoidingView>
    </>
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
  progress: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.light,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  form: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  countryCode: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  inputPhone: {
    flex: 1,
    height: 52,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    paddingVertical: spacing.md,
  },
  inputShort: {
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  colorDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  inlineError: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  nextBtnText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
});
