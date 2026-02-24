/**
 * JoinTeamScreen – Davet kodu ile takıma katılım (Firestore)
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { hapticLight } from '../utils/haptic';
import AlertModal from '../components/AlertModal';

type JoinTeamNavProp = StackNavigationProp<RootStackParamList, 'JoinTeam'>;
type JoinTeamRoute = RouteProp<RootStackParamList, 'JoinTeam'>;

export default function JoinTeamScreen() {
  const navigation = useNavigation<JoinTeamNavProp>();
  const route = useRoute<JoinTeamRoute>();
  const { user, joinTeam } = useAuth();
  const paramCode = route.params?.inviteCode?.trim().toUpperCase() ?? '';
  const [inviteCode, setInviteCode] = useState(paramCode);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'error' | 'success';
  } | null>(null);

  useEffect(() => {
    if (paramCode) setInviteCode(paramCode);
  }, [paramCode]);

  const handleJoin = async () => {
    hapticLight();
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setAlert({ title: 'Hata', message: 'Davet kodunu giriniz.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await joinTeam(code);
      if (res.status === 'ACTIVE') {
        setAlert({
          title: 'Başarılı',
          message: 'Takıma katıldınız! Ana sayfaya yönlendiriliyorsunuz.',
          type: 'success',
        });
      } else {
        setAlert({
          title: 'Katılım isteğiniz iletildi',
          message:
            'Takım admin, kaptan veya yöneticilerinden biri isteğinizi onayladığında takım bilgileriniz güncellenecek ve tüm takım akışlarına dahil olacaksınız.',
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Join team error:', err);
      setAlert({
        title: 'Katılım Başarısız',
        message: (err as Error).message ?? 'Geçersiz davet kodu veya bir hata oluştu.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const onAlertClose = () => {
    const wasSuccess = alert?.type === 'success';
    setAlert(null);
    if (wasSuccess) {
      navigation.getParent()?.goBack?.();
      navigation.navigate('MainTabs');
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Icon name="account-plus-outline" size={56} color={colors.primary} style={styles.notLoggedIcon} />
        <Text style={styles.notLoggedTitle}>Takıma katılmak için hesap gerekli</Text>
        <Text style={styles.notLoggedSub}>
          Davet koduyla takıma katılmak için önce kayıt olun. Hesabınız oluştuktan sonra katılım isteğiniz otomatik olarak takım yöneticilerine iletilecektir.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Register', { inviteCode: paramCode || undefined })}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Kayıt Ol</Text>
          <Icon name="arrow-right" size={20} color={colors.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Zaten hesabım var, giriş yap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <AlertModal
        visible={!!alert}
        title={alert?.title ?? ''}
        message={alert?.message ?? ''}
        type={alert?.type ?? 'info'}
        onConfirm={onAlertClose}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Takıma Katıl</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.content}>
          <Icon name="account-plus-outline" size={64} color={colors.primary} style={styles.icon} />
          <Text style={styles.subtitle}>
            Takım kaptanından aldığınız davet kodunu girin
          </Text>

          <TextInput
            style={styles.input}
            value={inviteCode}
            onChangeText={(t) => setInviteCode(t.toUpperCase())}
            placeholder="Örn: DEMO2025"
            placeholderTextColor={colors.text.disabled}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={20}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleJoin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Takıma Katıl</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  notLoggedIcon: { marginBottom: spacing.lg },
  notLoggedTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  notLoggedSub: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    width: '100%',
    maxWidth: 280,
    marginBottom: spacing.md,
  },
  primaryBtnText: {
    ...typography.button,
    color: colors.secondary,
  },
  secondaryBtn: {
    paddingVertical: spacing.sm,
  },
  secondaryBtnText: {
    ...typography.body,
    color: colors.text.tertiary,
  },
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
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  icon: { alignSelf: 'center', marginBottom: spacing.lg },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    letterSpacing: 2,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: {
    ...typography.button,
    color: '#fff',
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
});
