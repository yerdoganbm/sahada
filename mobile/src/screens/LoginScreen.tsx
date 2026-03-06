/**
 * LoginScreen (APK) — Web v11 ile birebir eşleştirildi
 * Akış: phone → 4-digit OTP (1234 demo) → name (yeni kullanıcı)
 * Context-aware: player / captain / venue_owner / join-code
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
  Animated, Easing, StatusBar, Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { hapticLight } from '../utils/haptic';

const { width: SW } = Dimensions.get('window');
const OTP_LEN  = 4;
const DEMO_OTP = '1234';

const ACCENTS = {
  green:  { primary: '#10B981', dim: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' },
  yellow: { primary: '#F59E0B', dim: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)'  },
  blue:   { primary: '#3B82F6', dim: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)'  },
};

const DEMO_USERS = [
  { phone: '5000000001', label: 'Admin',       icon: '🛡' },
  { phone: '5000000007', label: 'Kaptan Ali',  icon: '🏆' },
  { phone: '5000000002', label: 'Üye Ahmet',   icon: '⚽' },
  { phone: '5000000099', label: 'Saha Sahibi', icon: '🏟' },
];

type LoginRoute = RouteProp<RootStackParamList, 'Login'>;
type LoginNav   = StackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNav>();
  const route      = useRoute<LoginRoute>();
  const { loginWithCredentials } = useAuth();

  const pendingJoinCode = (route.params as any)?.pendingJoinCode as string | undefined;
  const pendingRole     = (route.params as any)?.pendingRole as 'captain' | 'member' | undefined;
  const userType        = (route.params as any)?.userType as 'venue_owner' | undefined;

  const isVenue   = userType === 'venue_owner';
  const isCaptain = pendingRole === 'captain';
  const hasCode   = !!pendingJoinCode;
  const accentKey = isVenue ? 'blue' : isCaptain ? 'yellow' : 'green';
  const ac        = ACCENTS[accentKey];

  const [step, setStep]           = useState<'phone' | 'otp' | 'name'>('phone');
  const [phone, setPhone]         = useState('');
  const [otp, setOtp]             = useState<string[]>(Array(OTP_LEN).fill(''));
  const [name, setName]           = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [verified, setVerified]   = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showDemo, setShowDemo]   = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const otpRefs   = useRef<(TextInput | null)[]>(Array(OTP_LEN).fill(null));

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [step]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const rawPhone   = phone.replace(/\D/g, '');
  const phoneValid = rawPhone.length >= 10;

  const fmtPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0,4)} ${d.slice(4)}`;
    if (d.length <= 9) return `${d.slice(0,4)} ${d.slice(4,7)} ${d.slice(7)}`;
    return `${d.slice(0,4)} ${d.slice(4,7)} ${d.slice(7,9)} ${d.slice(9)}`;
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleSend = () => {
    hapticLight();
    if (!phoneValid) { setError('Geçerli bir numara gir (min 10 hane)'); return; }
    setLoading(true); setError('');
    setTimeout(() => {
      setLoading(false); setStep('otp'); setCountdown(59);
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    }, 700);
  };

  const handleOtpChange = useCallback((idx: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[idx] = d; setOtp(next); setError('');
    if (d && idx < OTP_LEN - 1) setTimeout(() => otpRefs.current[idx + 1]?.focus(), 30);
    if (d && idx === OTP_LEN - 1 && next.every(Boolean)) setTimeout(() => doVerify(next), 80);
  }, [otp]);

  const handleOtpKey = (idx: number, key: string) => {
    if (key === 'Backspace') {
      if (otp[idx]) { const n = [...otp]; n[idx] = ''; setOtp(n); }
      else if (idx > 0) {
        const n = [...otp]; n[idx-1] = ''; setOtp(n);
        setTimeout(() => otpRefs.current[idx-1]?.focus(), 30);
      }
    }
  };

  const doVerify = (arr: string[]) => {
    const code = arr.join('');
    if (code.length < OTP_LEN) return;
    setLoading(true); setError('');
    setTimeout(() => {
      setLoading(false);
      if (code !== DEMO_OTP) {
        setError(`Hatalı kod — Demo: ${DEMO_OTP}`); triggerShake();
        setOtp(Array(OTP_LEN).fill(''));
        setTimeout(() => otpRefs.current[0]?.focus(), 60);
        return;
      }
      setVerified(true);
      setTimeout(() => {
        if (isVenue || hasCode) { finishLogin(); return; }
        const known = DEMO_USERS.some(u => rawPhone.endsWith(u.phone));
        if (known) { finishLogin(); return; }
        setStep('name');
      }, 500);
    }, 800);
  };

  const finishLogin = async () => {
    setLoading(true);
    try {
      try { await loginWithCredentials({ phone: rawPhone.slice(-10) }); } catch {}
      hapticLight();
      if (hasCode) {
        navigation.navigate('JoinTeam', { inviteCode: pendingJoinCode });
      } else if (isVenue) {
        navigation.dispatch(CommonActions.reset({
          index: 0,
          routes: [{ name: 'VenueOwnerOnboarding', params: { phone: rawPhone.slice(-10) } }],
        }));
      } else {
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
      }
    } finally { setLoading(false); }
  };

  const quickFill = (userPhone: string) => {
    hapticLight(); setPhone(fmtPhone(userPhone)); setShowDemo(false);
    setTimeout(() => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false); setStep('otp'); setCountdown(59);
        setTimeout(() => { const d = DEMO_OTP.split(''); setOtp(d); setTimeout(() => doVerify(d), 80); }, 200);
      }, 500);
    }, 100);
  };

  const stepIdx    = ['phone', 'otp', 'name'].indexOf(step);
  const totalSteps = hasCode || isVenue ? 2 : 3;

  const badge = hasCode ? { emoji: '🔗', text: `Kod: ${pendingJoinCode}`, color: '#10B981' }
    : isCaptain ? { emoji: '🏆', text: 'Kaptan kaydı', color: '#F59E0B' }
    : isVenue   ? { emoji: '🏟', text: 'Saha sahibi girişi', color: '#3B82F6' }
    : null;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: '#07090e' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#07090e" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={s.header}>
            <View style={s.navRow}>
              <TouchableOpacity
                onPress={() => step === 'otp'
                  ? (setStep('phone'), setOtp(Array(OTP_LEN).fill('')), setVerified(false))
                  : navigation.goBack()}
                style={s.backBtn} activeOpacity={0.7}>
                <Text style={s.backIcon}>‹</Text>
              </TouchableOpacity>
              <View style={s.progress}>
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <View key={i} style={[s.dot, { width: i === stepIdx ? 22 : 7, backgroundColor: i <= stepIdx ? ac.primary : 'rgba(255,255,255,0.1)' }]} />
                ))}
              </View>
              <Text style={s.stepCount}>{stepIdx + 1}/{totalSteps}</Text>
            </View>
            {badge && (
              <View style={[s.badge, { backgroundColor: badge.color + '18', borderColor: badge.color + '50' }]}>
                <Text style={s.badgeEmoji}>{badge.emoji}</Text>
                <Text style={[s.badgeText, { color: badge.color }]}>{badge.text}</Text>
              </View>
            )}
          </View>

          <Animated.View style={[s.body, { opacity: fadeAnim, transform: [{ translateX: shakeAnim }] }]}>

            {step === 'phone' && (
              <>
                <Text style={s.headline}>{isVenue ? 'Sahanı\nEkle' : hasCode ? 'Takıma\nKatıl' : isCaptain ? 'Kaptan\nKaydı' : 'Hoş\nGeldin'}</Text>
                <Text style={s.subhead}>{isVenue ? 'Saha sahibi girişi' : hasCode ? 'Giriş yap, takıma katıl' : 'Telefon numaranı gir'}</Text>
                <View style={[s.phoneWrap, { borderColor: phoneValid ? ac.primary : 'rgba(255,255,255,0.1)' }, phoneValid && { shadowColor: ac.primary, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 }]}>
                  <Text style={{ fontSize: 22 }}>🇹🇷</Text>
                  <View style={s.phoneDivider} />
                  <TextInput style={s.phoneInput} value={phone} onChangeText={v => { setPhone(fmtPhone(v)); setError(''); }} placeholder="0532 000 00 00" placeholderTextColor="rgba(255,255,255,0.15)" keyboardType="phone-pad" returnKeyType="done" onSubmitEditing={handleSend} autoFocus />
                  {phoneValid && <View style={[s.check, { backgroundColor: ac.primary }]}><Text style={s.checkTxt}>✓</Text></View>}
                </View>
                {error ? <Text style={s.error}>{error}</Text> : null}
                <View style={s.infoBox}><Text style={s.infoTxt}>Demo — herhangi bir numara (min 10 hane)</Text></View>
                <TouchableOpacity onPress={() => { hapticLight(); setShowDemo(d => !d); }} style={s.demoToggle} activeOpacity={0.7}>
                  <Text style={s.demoToggleTxt}>⚡ Hızlı Demo Girişi</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{showDemo ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {showDemo && (
                  <View style={s.demoPanel}>
                    {DEMO_USERS.map(u => (
                      <TouchableOpacity key={u.phone} onPress={() => quickFill(u.phone)} style={s.demoRow} activeOpacity={0.7}>
                        <Text style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{u.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.demoLabel}>{u.label}</Text>
                          <Text style={s.demoPhone}>+90 {u.phone}</Text>
                        </View>
                        <View style={s.demoBadge}><Text style={s.demoBadgeTxt}>1 tık</Text></View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <View style={{ flex: 1, minHeight: 32 }} />
                <TouchableOpacity onPress={handleSend} disabled={loading || !phoneValid} activeOpacity={0.85}
                  style={[s.cta, { backgroundColor: phoneValid ? ac.primary : 'rgba(255,255,255,0.06)', shadowColor: ac.primary, shadowOpacity: phoneValid ? 0.5 : 0, shadowRadius: 18, elevation: phoneValid ? 6 : 0 }]}>
                  <Text style={[s.ctaTxt, { color: phoneValid ? '#060a0e' : 'rgba(255,255,255,0.2)' }]}>{loading ? 'Gönderiliyor…' : 'Kod Gönder →'}</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'otp' && (
              <>
                <View style={[s.otpIcon, { backgroundColor: ac.dim, borderColor: ac.border }]}><Text style={{ fontSize: 32 }}>⚽</Text></View>
                <Text style={s.headline}>{verified ? '✓ Doğrulandı' : 'Kodu Gir'}</Text>
                <Text style={s.subhead}><Text style={{ color: 'white', fontWeight: '900' }}>{phone} </Text>numarasına {OTP_LEN} haneli SMS</Text>
                <View style={s.otpRow}>
                  {otp.map((d, i) => (
                    <TextInput key={i} ref={el => { otpRefs.current[i] = el; }}
                      style={[s.otpBox, { borderColor: verified ? ac.primary : d ? ac.primary : 'rgba(255,255,255,0.12)', backgroundColor: verified ? ac.dim : d ? ac.dim : 'rgba(255,255,255,0.04)', color: verified ? ac.primary : 'white', transform: [{ scale: d ? 1.05 : 1 }] }]}
                      value={d} onChangeText={v => handleOtpChange(i, v)} onKeyPress={({ nativeEvent: { key } }) => handleOtpKey(i, key)}
                      keyboardType="number-pad" maxLength={1} textAlign="center" editable={!loading && !verified} selectTextOnFocus />
                  ))}
                </View>
                {error ? <View style={s.errBox}><Text style={s.errTxt}>{error}</Text></View> : null}
                <View style={s.otpFooter}>
                  <TouchableOpacity onPress={() => { setStep('phone'); setOtp(Array(OTP_LEN).fill('')); setVerified(false); setError(''); }}>
                    <Text style={s.changeTxt}>‹ Değiştir</Text>
                  </TouchableOpacity>
                  {countdown > 0
                    ? <Text style={s.cdTxt}>{countdown}s bekle</Text>
                    : <TouchableOpacity onPress={handleSend}><Text style={[s.resendTxt, { color: ac.primary }]}>Tekrar gönder</Text></TouchableOpacity>}
                </View>
                <TouchableOpacity onPress={() => { const d = DEMO_OTP.split(''); setOtp(d); setError(''); setTimeout(() => doVerify(d), 80); }} style={s.demoShortcut} activeOpacity={0.7}>
                  <Text style={s.demoShortcutTxt}>⚡ Demo kod: {DEMO_OTP} — otomatik doldur</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, minHeight: 32 }} />
                <TouchableOpacity onPress={() => doVerify(otp)} disabled={!otp.every(Boolean) || loading || verified} activeOpacity={0.85}
                  style={[s.cta, { backgroundColor: verified ? '#10B981' : otp.every(Boolean) ? ac.primary : 'rgba(255,255,255,0.06)', shadowColor: ac.primary, shadowOpacity: otp.every(Boolean) ? 0.5 : 0, shadowRadius: 18, elevation: otp.every(Boolean) ? 6 : 0 }]}>
                  <Text style={[s.ctaTxt, { color: otp.every(Boolean) ? '#060a0e' : 'rgba(255,255,255,0.2)' }]}>
                    {verified ? 'Doğrulandı! ✓' : loading ? 'Kontrol ediliyor…' : `Doğrula ${hasCode ? '& Katıl' : '& Giriş Yap'} →`}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'name' && (
              <>
                <Text style={{ fontSize: 52, textAlign: 'center', marginBottom: 20 }}>👋</Text>
                <Text style={s.headline}>Adını gir</Text>
                <Text style={s.subhead}>{isCaptain ? 'Takım üyeleri seni bu isimle tanıyacak' : 'Diğer oyuncular seni bu isimle görecek'}</Text>
                <TextInput style={[s.nameInput, { borderColor: name.trim().length >= 2 ? ac.primary : 'rgba(255,255,255,0.1)', shadowColor: ac.primary, shadowOpacity: name.trim().length >= 2 ? 0.25 : 0, shadowRadius: 12 }]}
                  value={name} onChangeText={setName} placeholder={isCaptain ? 'Kaptan adı…' : 'Ad Soyad'}
                  placeholderTextColor="rgba(255,255,255,0.15)" autoFocus returnKeyType="done"
                  onSubmitEditing={() => name.trim().length >= 2 && finishLogin()} />
                <View style={s.emojiRow}>
                  {['⚽','🏃','🔥','💪','⚡','🎯'].map(e => (
                    <TouchableOpacity key={e} onPress={() => { hapticLight(); setName(n => n + e); }} style={s.emojiBtn} activeOpacity={0.7}>
                      <Text style={{ fontSize: 20 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flex: 1, minHeight: 32 }} />
                <TouchableOpacity onPress={finishLogin} disabled={name.trim().length < 2 || loading} activeOpacity={0.85}
                  style={[s.cta, { backgroundColor: name.trim().length >= 2 ? ac.primary : 'rgba(255,255,255,0.06)', shadowColor: ac.primary, shadowOpacity: name.trim().length >= 2 ? 0.5 : 0, shadowRadius: 18, elevation: name.trim().length >= 2 ? 6 : 0 }]}>
                  <Text style={[s.ctaTxt, { color: name.trim().length >= 2 ? '#060a0e' : 'rgba(255,255,255,0.2)' }]}>{loading ? 'Giriş yapılıyor…' : "Sahada'ya Başla →"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Register', { prefillPhone: rawPhone.slice(-10) })} style={{ marginTop: 14, alignItems: 'center' }} activeOpacity={0.7}>
                  <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: '600' }}>Tam hesap oluştur →</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: 'rgba(255,255,255,0.5)', fontSize: 26, lineHeight: 30, marginTop: -2 },
  progress: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { height: 3, borderRadius: 4 },
  stepCount: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.2)', minWidth: 24, textAlign: 'right' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, borderWidth: 1, alignSelf: 'flex-start', marginBottom: 4 },
  badgeEmoji: { fontSize: 13 },
  badgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },
  body: { flex: 1, paddingHorizontal: 20, paddingBottom: 36, minHeight: 480 },
  headline: { fontSize: 34, fontWeight: '900', color: 'white', lineHeight: 40, letterSpacing: -0.5, marginBottom: 10 },
  subhead: { fontSize: 14, color: 'rgba(255,255,255,0.38)', marginBottom: 32, lineHeight: 20 },
  phoneWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 16, height: 66, marginBottom: 8 },
  phoneDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 12 },
  phoneInput: { flex: 1, color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  check: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  checkTxt: { color: '#060a0e', fontSize: 14, fontWeight: '900' },
  error: { color: '#F87171', fontSize: 11, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  infoBox: { backgroundColor: 'rgba(59,130,246,0.07)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)', borderRadius: 12, padding: 10, marginBottom: 12 },
  infoTxt: { color: '#60A5FA', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  demoToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 11, marginBottom: 4 },
  demoToggleTxt: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5 },
  demoPanel: { backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  demoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  demoLabel: { color: 'white', fontSize: 12, fontWeight: '900' },
  demoPhone: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 1 },
  demoBadge: { backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  demoBadgeTxt: { color: '#10B981', fontSize: 9, fontWeight: '900' },
  otpIcon: { width: 64, height: 64, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 10, justifyContent: 'center' },
  otpBox: { width: (SW - 80) / 4, height: 76, borderRadius: 20, borderWidth: 2, fontSize: 30, fontWeight: '900' },
  errBox: { backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 12, padding: 12, marginBottom: 12 },
  errTxt: { color: '#FCA5A5', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  otpFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  changeTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700' },
  cdTxt: { color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: '700' },
  resendTxt: { fontSize: 12, fontWeight: '900' },
  demoShortcut: { backgroundColor: 'rgba(245,158,11,0.07)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.18)', borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  demoShortcutTxt: { color: '#FCD34D', fontSize: 12, fontWeight: '900' },
  nameInput: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 20, height: 64, color: 'white', fontSize: 22, fontWeight: '900', marginBottom: 14 },
  emojiRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  emojiBtn: { flex: 1, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  cta: { height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  ctaTxt: { fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },
});
