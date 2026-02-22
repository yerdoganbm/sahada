/**
 * JoinTeamScreen – Davet kodu ile takıma katılım (Firestore)
 */

import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { hapticLight } from '../utils/haptic';
import AlertModal from '../components/AlertModal';

type JoinTeamNavProp = StackNavigationProp<RootStackParamList, 'JoinTeam'>;

export default function JoinTeamScreen() {
  const navigation = useNavigation<JoinTeamNavProp>();
  const { user, joinTeam } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'error' | 'success';
  } | null>(null);

  const handleJoin = async () => {
    hapticLight();
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setAlert({ title: 'Hata', message: 'Davet kodunu giriniz.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await joinTeam(code);
      setAlert({
        title: 'Başarılı',
        message: 'Takıma katıldınız! Ana sayfaya yönlendiriliyorsunuz.',
        type: 'success',
      });
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
    setAlert(null);
    if (alert?.type === 'success') {
      navigation.getParent()?.goBack?.();
      navigation.navigate('MainTabs');
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Giriş yapmanız gerekiyor</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnText}>Giriş Yap</Text>
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
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
