/**
 * Member Onboarding Screen
 * Simple onboarding form: fullName (required), phone (optional)
 * Step 2 of 2 with progress bar
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../theme';
import AppScrollView from '../components/AppScrollView';

export default function MemberOnboardingScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = fullName.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert('Hata', 'Ad Soyad alanı zorunludur.');
      return;
    }

    setSubmitting(true);
    try {
      // In a real app, this would call an API to update user profile
      // await updateProfile({ fullName, phone });
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: 'Dashboard' } }],
        }),
      );
    } catch {
      Alert.alert('Hata', 'Bir sorun oluştu. Tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Bilgileri</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '100%' }]} />
        </View>
        <Text style={styles.progressText}>Adım 2/2</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AppScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome icon */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeIcon}>
              <Icon name="account-check" size={48} color={colors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>Son bir adım!</Text>
            <Text style={styles.welcomeSub}>
              Profilini tamamla ve takımına katıl
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Ad Soyad *</Text>
            <View style={[styles.inputContainer, !isValid && fullName.length > 0 && styles.inputError]}>
              <Icon name="account-outline" size={20} color={colors.text.tertiary} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Adınız ve soyadınız"
                placeholderTextColor={colors.text.tertiary}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {isValid && (
                <Icon name="check-circle" size={20} color={colors.success} />
              )}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>
              Telefon Numarası (Opsiyonel)
            </Text>
            <View style={styles.inputContainer}>
              <Icon name="phone-outline" size={20} color={colors.text.tertiary} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+90 5XX XXX XX XX"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>
            <Text style={styles.fieldHint}>
              Telefon numarası sadece kaptan tarafından iletişim için kullanılır
            </Text>
          </View>
        </AppScrollView>
      </KeyboardAvoidingView>

      {/* Bottom action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitBtn, (!isValid || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <Text style={styles.submitBtnText}>Kaydediliyor...</Text>
          ) : (
            <>
              <Text style={styles.submitBtnText}>Tamamla</Text>
              <Icon name="check" size={20} color={colors.secondary} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  // Progress
  progressSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    letterSpacing: 1,
  },
  // Content
  content: { flex: 1, paddingHorizontal: spacing.lg },
  scrollContent: { paddingBottom: 120 },
  // Welcome
  welcomeSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  welcomeIcon: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary}18`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  welcomeSub: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  // Form
  formSection: {
    marginTop: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.sm,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    padding: 0,
  },
  fieldHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  // Bottom
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
});
