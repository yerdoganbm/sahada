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
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from 'react-native-biometrics';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { hapticLight } from '../utils/haptic';

const BIOMETRIC_USER_KEY = '@sahada_biometric_user';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const rnBiometrics = new ReactNativeBiometrics();

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [savedUserId, setSavedUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
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
    hapticLight();
    if (!phone.trim()) {
      Alert.alert('Hata', 'Lütfen telefon numaranızı giriniz.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Mock authentication logic
      let userId = phone;
      
      if (phone.includes('admin') || phone === '1') {
        userId = '1'; // Admin
      } else if (phone.includes('kaptan') || phone === '7') {
        userId = '7'; // Captain
      } else if (phone === '2') {
        userId = '2'; // Member
      }
      
      await login(userId);
      // Navigation handled by RootNavigator based on auth state
    } catch (error) {
      Alert.alert('Hata', 'Giriş yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    hapticLight();
    if (!savedUserId) return;
    setIsLoading(true);
    try {
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Sahada ile giriş yap',
        cancelButtonText: 'İptal',
      });
      if (success) {
        await login(savedUserId);
      }
    } catch (error) {
      Alert.alert('Hata', 'Biyometrik doğrulama başarısız.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityLabel="Geri"
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Icon name="soccer" size={56} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Giriş Yap</Text>
        <Text style={styles.subtitle}>Numaran ile hızlıca sahalara dön.</Text>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>TELEFON NUMARASI</Text>
          <View style={styles.phoneInputWrapper}>
            <Text style={styles.countryCode}>+90</Text>
            <TextInput
              style={styles.input}
              placeholder="5XX XXX XX XX"
              placeholderTextColor={colors.text.disabled}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
          accessibilityLabel="Giriş yap"
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

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>VEYA</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Create Team Button */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('TeamSetup')}
          activeOpacity={0.8}
        >
          <Icon name="plus-circle-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.secondaryButtonText}>Takımını Sıfırdan Kur</Text>
        </TouchableOpacity>

        {/* Test Users Info */}
        <View style={styles.testInfo}>
          <Text style={styles.testInfoText}>
            Test için: Admin=1, Kaptan=7, Üye=2
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  testInfoText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
    textAlign: 'center',
  },
});
