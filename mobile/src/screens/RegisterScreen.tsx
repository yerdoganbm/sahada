/**
 * RegisterScreen – Hesap oluştur (takımsız). Sonra takım kodu ile katılınabilir.
 * inviteCode params ile gelirse kayıt sonrası otomatik katılım isteği gönderilir.
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
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getTeamByInviteCode } from '../services/firestore';
import { requestJoin } from '../services/joinRequestService';
import { RootStackParamList } from '../types';
import type { PlayerPosition } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { hapticLight } from '../utils/haptic';
import AlertModal from '../components/AlertModal';

const POS_LABELS: Record<PlayerPosition, string> = {
  GK: 'Kaleci',
  DEF: 'Defans',
  MID: 'Orta Saha',
  FWD: 'Forvet',
};
const POSITIONS: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

/** Yaygın forma numaraları – hızlı seçim için */
const QUICK_SHIRT_NUMBERS = [1, 7, 9, 10, 11, 17, 21, 77, 99];

type RegisterRoute = RouteProp<RootStackParamList, 'Register'>;
type RegisterNavProp = StackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterNavProp>();
  const route = useRoute<RegisterRoute>();
  const { registerOnly, completeRegistration } = useAuth();
  const prefillPhone = route.params?.prefillPhone ?? '';
  const inviteCodeParam = route.params?.inviteCode?.trim().toUpperCase() ?? '';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState(prefillPhone);
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('MID');
  const [shirtNumber, setShirtNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<import('../types').Player | null>(null);
  const [alert, setAlert] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'error' | 'success';
  } | null>(null);

  useEffect(() => {
    if (prefillPhone) setPhone(prefillPhone);
  }, [prefillPhone]);

  const handleRegister = async () => {
    hapticLight();
    const nameTrim = name.trim();
    if (!nameTrim || nameTrim.length < 2) {
      setAlert({ title: 'Eksik bilgi', message: 'Ad soyad en az 2 karakter olmalıdır.', type: 'error' });
      return;
    }
    if (nameTrim.length > 100) {
      setAlert({ title: 'Eksik bilgi', message: 'Ad soyad en fazla 100 karakter olabilir.', type: 'error' });
      return;
    }
    const phoneTrim = phone.trim().replace(/\D/g, '');
    if (phoneTrim.length < 10) {
      setAlert({ title: 'Eksik bilgi', message: 'Geçerli bir telefon numarası giriniz (10 hane).', type: 'error' });
      return;
    }
    if (phoneTrim.length > 10 || !/^5[0-9]{9}$/.test(phoneTrim)) {
      setAlert({ title: 'Geçersiz numara', message: 'Telefon numarası 5 ile başlayan 10 haneli olmalıdır (örn: 532 123 45 67).', type: 'error' });
      return;
    }
    const emailTrim = email.trim();
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setAlert({ title: 'Geçersiz e-posta', message: 'Lütfen geçerli bir e-posta adresi girin veya boş bırakın.', type: 'error' });
      return;
    }
    setLoading(true);
    setPendingUser(null);
    const num = shirtNumber.trim() ? parseInt(shirtNumber.replace(/\D/g, ''), 10) : undefined;
    const validNum = num != null && !isNaN(num) && num >= 1 && num <= 99 ? num : undefined;

    try {
      const newUser = await registerOnly({
        name: nameTrim,
        phone: phone.trim(),
        email: email.trim() || undefined,
        position,
        shirtNumber: validNum,
      });
      setPendingUser(newUser);
      if (inviteCodeParam) {
        try {
          const team = await getTeamByInviteCode(inviteCodeParam);
          if (team) {
            const res = await requestJoin({ teamId: team.id, userId: newUser.id });
            if (res.status === 'ACTIVE') {
              setAlert({
                title: 'Takıma katıldınız',
                message: 'Hesabınız oluşturuldu ve takıma eklendiniz. Devam ederek ana sayfaya gidebilirsiniz.',
                type: 'success',
              });
            } else {
              setAlert({
                title: 'Katılım isteğiniz iletildi',
                message:
                  'Hesabınız oluşturuldu. Takıma katılım isteğiniz yöneticilere iletildi; onaylandığında takım bilgileri görünecektir.',
                type: 'success',
              });
            }
          } else {
            setAlert({
              title: 'Hesap oluşturuldu',
              message:
                'Kayıt tamamlandı. Geçersiz davet kodu. Uygulama içinden "Takıma Katıl" ile doğru kodu girebilirsiniz.',
              type: 'success',
            });
          }
        } catch {
          setAlert({
            title: 'Hesap oluşturuldu',
            message:
              'Kayıt tamamlandı. Takıma katılmak için uygulama içinden "Takıma Katıl" ekranından davet kodunu girebilirsiniz.',
            type: 'success',
          });
        }
      } else {
        setAlert({
          title: 'Kayıt tamamlandı',
          message: 'Hesabınız oluşturuldu. Devam ederek takım kodu girebilir veya takım kurabilirsiniz.',
          type: 'success',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kayıt yapılamadı.';
      setAlert({ title: 'Kayıt başarısız', message: msg, type: 'error' });
      // #region agent log
      fetch('http://127.0.0.1:7748/ingest/ac5c5351-5103-4522-8149-3f9d9e41282d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9eeead' },
        body: JSON.stringify({
          sessionId: '9eeead',
          location: 'RegisterScreen.tsx:catch',
          message: 'Registration error shown',
          data: { message: msg },
          hypothesisId: 'H3',
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    } finally {
      setLoading(false);
    }
  };

  const onAlertClose = async () => {
    const userToComplete = pendingUser;
    setAlert(null);
    setPendingUser(null);
    if (userToComplete) {
      await completeRegistration(userToComplete);
    }
  };

  return (
    <>
      <AlertModal
        visible={!!alert}
        title={alert?.title ?? ''}
        message={alert?.message ?? ''}
        type={alert?.type ?? 'info'}
        confirmText="Tamam"
        onConfirm={onAlertClose}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => { hapticLight(); navigation.goBack(); }}
            style={styles.backBtn}
            accessibilityLabel="Geri"
            accessibilityRole="button"
          >
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kayıt Ol</Text>
          <View style={styles.placeholder} />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <View style={styles.iconWrap}>
            <Icon name="account-plus-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>Hesap oluştur</Text>
          <Text style={styles.subtitle}>
            Oyuna girmek için kayıt olun. Sonra takım kodunu girerek takıma katılabilir veya takım kurabilirsiniz.
          </Text>
          <View style={styles.form}>
            <Text style={styles.label}>Ad Soyad *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Örn: Ahmet Yılmaz"
              placeholderTextColor={colors.text.disabled}
              autoCapitalize="words"
              editable={!loading}
              accessibilityLabel="Ad Soyad"
              maxLength={100}
            />
            <Text style={styles.label}>Telefon *</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.countryCode}>+90</Text>
              <TextInput
                style={styles.inputPhone}
                value={phone}
                onChangeText={(t) => {
                  const d = t.replace(/\D/g, '');
                  const noLeadingZero = d.startsWith('0') ? d.slice(1) : d;
                  setPhone(noLeadingZero.slice(0, 10));
                }}
                placeholder="5XX XXX XX XX"
                placeholderTextColor={colors.text.disabled}
                keyboardType="phone-pad"
                editable={!loading}
                accessibilityLabel="Telefon numarası"
              />
            </View>
            <Text style={styles.label}>E-posta (opsiyonel)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@email.com"
              placeholderTextColor={colors.text.disabled}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              accessibilityLabel="E-posta"
            />

            <Text style={[styles.label, styles.optionalSectionTitle]}>Oyun bilgileri (opsiyonel)</Text>
            <Text style={styles.labelSmall}>Mevki</Text>
            <View style={styles.positionRow}>
              {POSITIONS.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  style={[styles.positionChip, position === pos && styles.positionChipActive]}
                  onPress={() => !loading && setPosition(pos)}
                  activeOpacity={0.8}
                  disabled={loading}
                  accessibilityLabel={POS_LABELS[pos]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: position === pos }}
                >
                  <Text
                    style={[styles.positionChipText, position === pos && styles.positionChipTextActive]}
                    numberOfLines={1}
                  >
                    {POS_LABELS[pos]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.labelSmall}>Forma numarası</Text>
            <View style={styles.shirtNumberSection}>
              <View style={styles.quickNumbersRow}>
                {QUICK_SHIRT_NUMBERS.map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.shirtChip, shirtNumber === String(n) && styles.shirtChipActive]}
                    onPress={() => !loading && setShirtNumber(shirtNumber === String(n) ? '' : String(n))}
                    activeOpacity={0.8}
                    disabled={loading}
                  >
                    <Text style={[styles.shirtChipText, shirtNumber === String(n) && styles.shirtChipTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.shirtChip, styles.shirtChipEmpty, !shirtNumber && styles.shirtChipActive]}
                  onPress={() => !loading && setShirtNumber('')}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Text style={[styles.shirtChipText, !shirtNumber && styles.shirtChipTextActive]}>—</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.shirtNumberInputWrap}>
                <Text style={styles.shirtNumberHint}>veya 1–99 arası yazın</Text>
                <View style={styles.jerseyBadge}>
                  <TextInput
                    style={styles.jerseyInput}
                    value={shirtNumber}
                    onChangeText={(t) => setShirtNumber(t.replace(/\D/g, '').slice(0, 2))}
                    placeholder="—"
                    placeholderTextColor={colors.text.disabled}
                    keyboardType="number-pad"
                    maxLength={2}
                    editable={!loading}
                    selectTextOnFocus
                  />
                </View>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
            accessibilityLabel="Kayıt ol"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color={colors.secondary} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Kayıt Ol</Text>
                <Icon name="arrow-right" size={20} color={colors.secondary} />
              </>
            )}
          </TouchableOpacity>
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
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  placeholder: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  form: { marginBottom: spacing.xl },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
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
  phoneRow: {
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
    height: 56,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  optionalSectionTitle: { marginTop: spacing.lg },
  labelSmall: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  positionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  positionChip: {
    flex: 1,
    minWidth: 72,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  positionChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  positionChipTextActive: {
    color: colors.secondary,
  },
  shirtNumberSection: {
    marginBottom: spacing.md,
  },
  quickNumbersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  shirtChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shirtChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  shirtChipEmpty: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  shirtChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  shirtChipTextActive: {
    color: colors.secondary,
  },
  shirtNumberInputWrap: {
    alignItems: 'center',
  },
  shirtNumberHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  jerseyBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jerseyInput: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    padding: 0,
    minWidth: 36,
    textAlign: 'center',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
});
