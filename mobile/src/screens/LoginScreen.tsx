/**
 * Login Screen
 * User authentication with biometric support
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AppScrollView from '../components/AppScrollView';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { hapticLight } from '../utils/haptic';
import AlertModal from '../components/AlertModal';

const BIOMETRIC_USER_KEY = '@sahada_biometric_user';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

// react-native-biometrics sadece native'de; web'de yok
const getBiometrics = () =>
  Platform.OS === 'web' ? null : require('react-native-biometrics').default;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, loginWithCredentials, restoreSession } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'error' | 'warning' | 'success';
    confirmText?: string;
    onConfirm?: () => void;
    secondaryText?: string;
    onSecondary?: () => void;
  } | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [savedUserId, setSavedUserId] = useState<string | null>(null);

  useEffect(() => {
    const Biometrics = getBiometrics();
    if (!Biometrics) return;
    let cancelled = false;
    const rnBiometrics = new Biometrics();
    (async () => {
      try {
        const [sensor, userId] = await Promise.all([
          rnBiometrics.isSensorAvailable(),
          AsyncStorage.getItem(BIOMETRIC_USER_KEY),
        ]);
        if (!cancelled && sensor.available && userId) {
          setBiometricAvailable(true);
          setSavedUserId(userId);
        }
      } catch {
        if (!cancelled) setBiometricAvailable(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogin = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7748/ingest/ac5c5351-5103-4522-8149-3f9d9e41282d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9eeead' },
      body: JSON.stringify({
        sessionId: '9eeead',
        location: 'LoginScreen.tsx:handleLogin',
        message: 'handleLogin called',
        data: { isLoading, phoneLength: phone.trim().length },
        hypothesisId: 'H2',
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    hapticLight();
    const digits = phone.replace(/\D/g, '');
    if (!digits || digits.length < 10) {
      setAlert({
        title: 'Hata',
        message: 'Lütfen 10 haneli telefon numaranızı giriniz (5XX XXX XX XX).',
        type: 'warning',
      });
      return;
    }

    setIsLoading(true);
    try {
      await loginWithCredentials({ phone: phone.trim() });
    } catch (err) {
      console.error('Login error:', err);
      const digits = phone.trim().replace(/\D/g, '');
      // +90 gösterildiği için prefill'de başta 0 olmasın; 10 hane (5xxxxxxxxx) kullan
      const phoneForPrefill =
        digits.length >= 10
          ? digits.startsWith('90')
            ? digits.slice(2)
            : digits.startsWith('0')
              ? digits.slice(1)
              : digits.slice(-10)
          : phone.trim();
      setAlert({
        title: 'Hesabınız bulunamadı',
        message:
          'Bu numarayla kayıtlı hesap yok. Oyuna girmek için önce kayıt olun; ardından takım koduyla takıma katılabilir veya takım kurabilirsiniz.',
        type: 'info',
        confirmText: 'Kayıt Ol',
        onConfirm: () => {
          setAlert(null);
          navigation.navigate('Register', { prefillPhone: phoneForPrefill || phone.trim() });
        },
        secondaryText: 'Takım Kur',
        onSecondary: () => {
          setAlert(null);
          navigation.navigate('TeamSetup', { prefillPhone: phoneForPrefill || phone.trim() });
        },
      });
    } finally {
      setIsLoading(false);
      // #region agent log
      fetch('http://127.0.0.1:7748/ingest/ac5c5351-5103-4522-8149-3f9d9e41282d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9eeead' },
        body: JSON.stringify({
          sessionId: '9eeead',
          location: 'LoginScreen.tsx:handleLogin:finally',
          message: 'Login loading ended',
          data: {},
          hypothesisId: 'H2',
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    }
  };

  const handleBiometricLogin = async () => {
    hapticLight();
    if (!savedUserId) return;
    const Biometrics = getBiometrics();
    if (!Biometrics) return;
    setIsLoading(true);
    try {
      const rnBiometrics = new Biometrics();
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Sahada ile giriş yap',
        cancelButtonText: 'İptal',
      });
      if (success) {
        await restoreSession(savedUserId);
      }
    } catch {
      setAlert({ title: 'Hata', message: 'Biyometrik doğrulama başarısız.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <AlertModal
      visible={!!alert}
      title={alert?.title ?? ''}
      message={alert?.message ?? ''}
      type={alert?.type ?? 'info'}
      confirmText={alert?.confirmText ?? 'Tamam'}
      onConfirm={alert?.onConfirm ?? (() => setAlert(null))}
      secondaryText={alert?.secondaryText}
      onSecondary={alert?.onSecondary}
    />
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Üst bar - geri butonu (logo ile çakışmayı önler) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            navigation.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: 'Welcome' }] })
            );
          }}
          activeOpacity={0.7}
          accessibilityLabel="Geri"
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
          <Text style={styles.backButtonText}>Geri</Text>
        </TouchableOpacity>
      </View>

      <AppScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Icon name="soccer" size={56} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Giriş Yap</Text>
        <Text style={styles.subtitle}>Numaran ile hızlıca sahalara dön.</Text>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>TELEFON NUMARASI *</Text>
          <View style={styles.phoneInputWrapper}>
            <Text style={styles.countryCode}>+90</Text>
            <TextInput
              style={styles.input}
              placeholder="5XX XXX XX XX"
              placeholderTextColor={colors.text.disabled}
              value={phone}
              onChangeText={(t) => {
                const d = t.replace(/\D/g, '');
                const noLeadingZero = d.startsWith('0') ? d.slice(1) : d;
                setPhone(noLeadingZero.slice(0, 10));
              }}
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Telefon numarası"
            />
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
          accessibilityLabel="Devam Et"
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator color={colors.secondary} />
          ) : (
            <>
              <Text style={styles.loginButtonText}>Devam Et</Text>
              <Icon name="arrow-right" size={20} color={colors.secondary} />
            </>
          )}
        </TouchableOpacity>

        {/* Biometric Login */}
        {biometricAvailable && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Icon name="fingerprint" size={24} color={colors.primary} />
            <Text style={styles.biometricButtonText}>
              Face ID / Parmak izi ile giriş
            </Text>
          </TouchableOpacity>
        )}

        {/* Hesap oluştur - her zaman görünür */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => {
            hapticLight();
            const digits = phone.replace(/\D/g, '');
            const prefill =
              digits.length >= 10
                ? digits.startsWith('90')
                  ? digits.slice(2)
                  : digits.startsWith('0')
                    ? digits.slice(1)
                    : digits.slice(-10)
                : '';
            navigation.navigate('Register', { prefillPhone: prefill });
          }}
          activeOpacity={0.8}
          accessibilityLabel="Hesap oluştur"
          accessibilityRole="button"
        >
          <Icon name="account-plus-outline" size={20} color={colors.primary} />
          <Text style={styles.registerButtonText}>Hesap oluştur</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>VEYA</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Create Team Button */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            hapticLight();
            const digitsForPrefill = phone.replace(/\D/g, '');
            const prefill =
              digitsForPrefill.length >= 10
                ? digitsForPrefill.startsWith('90')
                  ? digitsForPrefill.slice(2)
                  : digitsForPrefill.startsWith('0')
                    ? digitsForPrefill.slice(1)
                    : digitsForPrefill.slice(-10)
                : '';
            navigation.navigate('TeamSetup', { prefillPhone: prefill });
          }}
          activeOpacity={0.8}
          accessibilityLabel="Takımını sıfırdan kur"
          accessibilityRole="button"
        >
          <Icon name="plus-circle-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.secondaryButtonText}>Takımını Sıfırdan Kur</Text>
        </TouchableOpacity>

        {/* Demo Accounts */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>DEMO HESAPLAR</Text>
          <View style={styles.demoButtons}>
            {[
              { label: '👑 Admin', phone: '05320000001' },
              { label: '⭐ Kaptan', phone: '05320000002' },
              { label: '⚽ Üye', phone: '05320000003' },
              { label: '🏟️ Partner', phone: '05320000008' },
            ].map((d) => (
              <TouchableOpacity
                key={d.phone}
                style={styles.demoBtn}
                onPress={() => {
                  setPhone(d.phone);
                }}
              >
                <Text style={styles.demoBtnText}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.testInfoText}>
            Seçip "Devam Et" butonuna basın
          </Text>
        </View>
      </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'web' ? 24 : 60,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    minHeight: 400,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    transform: [{ rotate: '3deg' }],
  },
  title: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
  },
  countryCode: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  biometricButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.sm,
  },
  loginButtonText: {
    color: colors.secondary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.disabled,
    marginHorizontal: spacing.md,
    letterSpacing: 1.5,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  registerButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.sm,
  },
  testInfo: {
    marginTop: spacing.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  testInfoText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
    textAlign: 'center',
  },
  demoSection: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  demoTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  demoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  demoBtn: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  demoBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
});
