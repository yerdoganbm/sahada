/**
 * Team Setup Screen - Takım kurulumu (adım adım)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { TeamProfile } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

const COLOR_OPTIONS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function TeamSetupScreen() {
  const navigation = useNavigation();
  const { createTeamAndLogin } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [founderName, setFounderName] = useState('');
  const [founderEmail, setFounderEmail] = useState('');
  const [primaryColor, setPrimaryColor] = useState(COLOR_OPTIONS[0]);

  const inviteCode = (shortName || name.slice(0, 3).toUpperCase()) + '-' + new Date().getFullYear();

  const handleNext = () => {
    if (step === 1) {
      if (name.trim().length < 2) return;
      setStep(2);
    } else if (step === 2) {
      if (founderName.trim().length < 2) return;
      setStep(3);
    } else {
      const team: TeamProfile = {
        id: `team_${Date.now()}`,
        name: name.trim(),
        shortName: shortName.trim() || name.slice(0, 3).toUpperCase(),
        inviteCode,
        colors: [primaryColor, colors.secondary],
        founderName: founderName.trim(),
        founderEmail: founderEmail.trim() || undefined,
        foundedDate: new Date().toISOString().split('T')[0],
      };
      createTeamAndLogin(team, founderName.trim(), founderEmail.trim() || undefined);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  const canNext =
    (step === 1 && name.trim().length >= 2) ||
    (step === 2 && founderName.trim().length >= 2) ||
    step === 3;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
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

      <ScrollView
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
            <Text style={styles.label}>Takım Adı</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Örn: Kuzey Yıldızları"
              placeholderTextColor={colors.text.disabled}
              autoCapitalize="words"
            />
            <Text style={styles.label}>Kısaltma (3 harf)</Text>
            <TextInput
              style={[styles.input, styles.inputShort]}
              value={shortName}
              onChangeText={(t) => setShortName(t.toUpperCase().slice(0, 3))}
              placeholder="Örn: KZY"
              placeholderTextColor={colors.text.disabled}
              maxLength={3}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.form}>
            <Text style={styles.label}>Adın Soyadın</Text>
            <TextInput
              style={styles.input}
              value={founderName}
              onChangeText={setFounderName}
              placeholder="Örn: Ahmet Yılmaz"
              placeholderTextColor={colors.text.disabled}
              autoCapitalize="words"
            />
            <Text style={styles.label}>E-posta (opsiyonel)</Text>
            <TextInput
              style={styles.input}
              value={founderEmail}
              onChangeText={setFounderEmail}
              placeholder="ahmet@example.com"
              placeholderTextColor={colors.text.disabled}
              keyboardType="email-address"
              autoCapitalize="none"
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

        <TouchableOpacity
          style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canNext}
        >
          <Text style={styles.nextBtnText}>
            {step === 3 ? 'Tamamla' : 'Devam'}
          </Text>
          <Icon name="arrow-right" size={20} color={colors.secondary} />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
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
  nextBtnText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
});
