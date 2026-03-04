/**
 * Welcome Screen – Web ile uyumlu: Oyuncuyum / Saha Sahibiyim seçimi
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Animated,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

type UserType = 'player' | 'venue_owner' | null;

const PLAYER_FEATURES = [
  { icon: 'soccer' as const, text: 'Maç oluştur & katıl' },
  { icon: 'account-group' as const, text: 'Takımını yönet' },
  { icon: 'chart-line' as const, text: 'İstatistik takibi' },
  { icon: 'cash' as const, text: 'Borç & ödeme takibi' },
];

const VENUE_FEATURES = [
  { icon: 'calendar-check' as const, text: 'Rezervasyonları onayla' },
  { icon: 'chart-bar' as const, text: 'Gelir & doluluk raporu' },
  { icon: 'account-cog' as const, text: 'Müşteri yönetimi' },
  { icon: 'calendar-month' as const, text: 'Saha takvimi' },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const [selected, setSelected] = useState<UserType>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleContinue = () => {
    if (!selected) return;
    navigation.navigate('Login', { userType: selected });
  };

  const accentGreen = {
    border: colors.primary,
    bg: `${colors.primary}20`,
    text: colors.primary,
  };
  const accentBlue = {
    border: '#3B82F6',
    bg: 'rgba(59,130,246,0.15)',
    text: '#60A5FA',
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80' }}
      style={styles.container}
      blurRadius={3}
    >
      <View style={styles.overlay} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoContainer}>
            <Icon name="soccer" size={34} color="#fff" />
          </View>
          <Text style={styles.title}>SAHADA</Text>
          <Text style={styles.subtitle}>Maç Senin. Kontrol Sende.</Text>
        </Animated.View>

        <Text style={styles.roleLabel}>Nasıl kullanmak istiyorsun?</Text>

        <TouchableOpacity
          style={[
            styles.roleCard,
            selected === 'player' && { borderColor: accentGreen.border, backgroundColor: accentGreen.bg },
          ]}
          onPress={() => setSelected('player')}
          activeOpacity={0.8}
        >
          <View style={styles.roleRow}>
            <View style={[styles.roleIconWrap, selected === 'player' && { backgroundColor: accentGreen.bg }]}>
              <Icon name="soccer" size={24} color={selected === 'player' ? accentGreen.text : colors.text.disabled} />
            </View>
            <View style={styles.roleTextWrap}>
              <Text style={[styles.roleTitle, selected === 'player' && { color: colors.text.primary }]}>Oyuncuyum</Text>
              <Text style={styles.roleSubtitle}>Maç oyna, takım yönet, istatistik takip et</Text>
            </View>
            <View style={[styles.radio, selected === 'player' && { borderColor: colors.primary, backgroundColor: colors.primary }]}>
              {selected === 'player' && <View style={styles.radioInner} />}
            </View>
          </View>
          {selected === 'player' && (
            <View style={styles.featuresRow}>
              {PLAYER_FEATURES.map((f, i) => (
                <View key={i} style={styles.featureChip}>
                  <Icon name={f.icon} size={11} color={accentGreen.text} />
                  <Text style={styles.featureChipText}>{f.text}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleCard,
            selected === 'venue_owner' && { borderColor: accentBlue.border, backgroundColor: accentBlue.bg },
          ]}
          onPress={() => setSelected('venue_owner')}
          activeOpacity={0.8}
        >
          <View style={styles.roleRow}>
            <View style={[styles.roleIconWrap, selected === 'venue_owner' && { backgroundColor: accentBlue.bg }]}>
              <Icon name="stadium" size={24} color={selected === 'venue_owner' ? accentBlue.text : colors.text.disabled} />
            </View>
            <View style={styles.roleTextWrap}>
              <Text style={[styles.roleTitle, selected === 'venue_owner' && { color: colors.text.primary }]}>Saha Sahibiyim</Text>
              <Text style={styles.roleSubtitle}>Rezervasyon yönet, gelir takip et, sahan dolsun</Text>
            </View>
            <View style={[styles.radio, selected === 'venue_owner' && { borderColor: '#3B82F6', backgroundColor: '#3B82F6' }]}>
              {selected === 'venue_owner' && <View style={styles.radioInner} />}
            </View>
          </View>
          {selected === 'venue_owner' && (
            <View style={styles.featuresRow}>
              {VENUE_FEATURES.map((f, i) => (
                <View key={i} style={styles.featureChip}>
                  <Icon name={f.icon} size={11} color={accentBlue.text} />
                  <Text style={styles.featureChipText}>{f.text}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueBtn,
            selected === 'venue_owner' && styles.continueBtnVenue,
            !selected && styles.continueBtnDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selected}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>
            {selected ? 'Devam Et' : 'Bir seçenek seç'}
          </Text>
          {selected && <Icon name="arrow-right" size={18} color="#fff" />}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>veya</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Icon name="login" size={16} color={colors.text.disabled} />
          <Text style={styles.loginLinkText}>Zaten hesabım var, giriş yap</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Devam ederek Kullanım Koşulları ve Gizlilik Politikası'nı kabul edersiniz.
        </Text>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.primary}30`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    transform: [{ rotate: '-3deg' }],
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text.primary,
    fontStyle: 'italic',
  },
  subtitle: { fontSize: typography.fontSize.md, color: colors.text.secondary, marginTop: spacing.xs },
  roleLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.text.disabled,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  roleCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  roleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  roleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  roleTextWrap: { flex: 1, minWidth: 0 },
  roleTitle: { fontSize: typography.fontSize.sm, fontWeight: '800', color: colors.text.secondary },
  roleSubtitle: { fontSize: 11, color: colors.text.disabled, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.text.disabled,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', gap: spacing.sm },
  featureChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featureChipText: { fontSize: 10, color: colors.text.disabled },
  continueBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  continueBtnVenue: { backgroundColor: '#3B82F6' },
  continueBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)', opacity: 0.8 },
  continueBtnText: { color: '#fff', fontSize: typography.fontSize.lg, fontWeight: '800' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  dividerText: { fontSize: 10, fontWeight: '700', color: colors.text.disabled, marginHorizontal: spacing.md },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  loginLinkText: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.text.disabled },
  footer: { fontSize: 9, color: colors.text.disabled, textAlign: 'center', marginTop: spacing.lg, lineHeight: 14 },
});
