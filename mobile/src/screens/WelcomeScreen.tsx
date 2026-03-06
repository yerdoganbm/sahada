/**
 * WelcomeScreen (APK) — Web v11 ile birebir eşleştirildi
 * Siyah arka plan, perspektif saha çizgileri, swipeable role card
 * Akış: hero → player_start / venue_start → Login
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  SafeAreaView, ScrollView, Dimensions, Animated, Easing,
  PanResponder,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { hapticLight } from '../utils/haptic';

const { width: SW } = Dimensions.get('window');

// ─── ROLE CARD DATA ─────────────────────────────────────────
const ROLES = [
  {
    id: 'player',
    emoji: '⚽',
    title: 'Oyuncuyum',
    subtitle: 'Oyna, takip et, kazan',
    color: '#10B981',
    colorDim: 'rgba(16,185,129,0.12)',
    colorBorder: 'rgba(16,185,129,0.3)',
    badge: 'Ücretsiz',
    perks: [
      { icon: '🔗', text: 'WhatsApp davet linkiyle saniyeler içinde gir' },
      { icon: '💸', text: 'Ödeme takibi — kaptana gönder, kanıt yükle' },
      { icon: '📊', text: 'Maç istatistikleri ve RSVP yönetimi' },
    ],
  },
  {
    id: 'venue',
    emoji: '🏟️',
    title: 'Saha Sahibiyim',
    subtitle: 'Yönet, analiz et, büyüt',
    color: '#3B82F6',
    colorDim: 'rgba(59,130,246,0.12)',
    colorBorder: 'rgba(59,130,246,0.3)',
    badge: 'İş Ortağı',
    perks: [
      { icon: '📅', text: 'Rezervasyon takvimi & onay/red akışı' },
      { icon: '💰', text: 'Kasa, günlük kapanış, gelir raporu' },
      { icon: '👥', text: 'Personel yönetimi ve bakım takibi' },
    ],
  },
  {
    id: 'venue_staff',
    emoji: '👷',
    title: 'Sahada Çalışıyorum',
    subtitle: 'Personel veya muhasebe girişi',
    color: '#8B5CF6',
    colorDim: 'rgba(139,92,246,0.12)',
    colorBorder: 'rgba(139,92,246,0.3)',
    badge: 'Personel',
    perks: [
      { icon: '📋', text: 'Rezervasyon takibi ve takvim görünümü' },
      { icon: '💳', text: 'Gelen EFT ve kasa hareketleri' },
      { icon: '🔔', text: 'Bildirim ve müşteri iletişimi' },
    ],
  },
] as const;

const PLAYER_FIRST_STEPS = [
  {
    emoji: '🔗',
    label: 'Davet Koduyla Katıl',
    desc: "Kaptan WhatsApp'tan link attı, hemen takıma gir",
    badge: 'En hızlı',
    badgeColor: '#10B981',
    screen: 'PhoneAuth' as keyof RootStackParamList,
    role: null as 'captain' | 'member' | null,
    highlight: true,
  },
  {
    emoji: '🏆',
    label: 'Takım Kur',
    desc: 'Ekibini oluştur, maç planla, ödeme takip et',
    badge: 'Kaptan',
    badgeColor: '#F59E0B',
    screen: 'PhoneAuth' as keyof RootStackParamList,
    role: 'captain' as 'captain' | 'member' | null,
    highlight: false,
  },
  {
    emoji: '🔍',
    label: 'Saha Ara & Rezerve Et',
    desc: 'Yakınındaki sahaları bul, kendi adına rezervasyon yap',
    badge: null,
    badgeColor: '',
    screen: 'Login' as keyof RootStackParamList,
    role: 'member' as 'captain' | 'member' | null,
    highlight: false,
  },
];

const VENUE_FEATURES = [
  { icon: '📅', label: 'Rezervasyon Yönetimi',   desc: 'Talep al, onayla/reddet, takvimi yönet' },
  { icon: '📊', label: 'Gelir & Doluluk Analizi', desc: 'Günlük kasa, haftalık doluluk, KPI' },
  { icon: '👥', label: 'Personel & Muhasebe',     desc: 'Ekip yetkilendirme, gün kapanışı' },
  { icon: '🔧', label: 'Bakım & Sorun Takibi',    desc: 'Bakım görevleri, arıza bildirimleri' },
  { icon: '🔔', label: 'Anlık Bildirimler',       desc: 'Onay/iptal/ödeme durumu bildirimleri' },
];

type Nav = StackNavigationProp<RootStackParamList, 'Welcome'>;
type Step = 'hero' | 'player_start' | 'venue_start' | 'venue_staff_start';

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState<Step>('hero');
  const [activeRole, setActiveRole] = useState<0 | 1 | 2>(0);
  const [selectedPath, setSelectedPath] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const role = ROLES[activeRole];

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [step]);

  // Swipe handler for role cards
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 20,
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) > 40) {
          hapticLight();
          setActiveRole((prev) => {
            if (gs.dx < 0) return Math.min(prev + 1, 2) as 0 | 1 | 2;
            return Math.max(prev - 1, 0) as 0 | 1 | 2;
          });
        }
      },
    })
  ).current;

  const goTo = (next: Step) => {
    hapticLight();
    setStep(next);
    setSelectedPath(null);
  };

  // ══════════════════════════════════════════════════════════
  // HERO
  // ══════════════════════════════════════════════════════════
  if (step === 'hero') {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor="#060a0e" />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} bounces={false}>

          {/* ── Brand Top ── */}
          <Animated.View style={[s.brandSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Floating logo */}
            <View style={[s.logoOuter, { shadowColor: role.color }]}>
              <View style={[s.logoBox, { backgroundColor: role.color }]}>
                <Text style={s.logoStar}>★</Text>
              </View>
            </View>

            {/* Wordmark */}
            <Text style={[s.wordmark, { textShadowColor: `${role.color}55` }]}>SAHADA</Text>
            <View style={[s.wordmarkLine, { backgroundColor: role.color }]} />
            <Text style={s.tagline}>
              Maç Senin · <Text style={{ color: role.color }}>Kontrol Sende</Text>
            </Text>
          </Animated.View>

          {/* ── Stats Strip ── */}
          <Animated.View style={[s.statsRow, { opacity: fadeAnim }]}>
            {[['10K+', 'Oyuncu'], ['850+', 'Saha'], ['42K+', 'Maç']].map(([v, l], i) => (
              <View key={i} style={[s.statItem, i > 0 && s.statBorder]}>
                <Text style={s.statValue}>{v}</Text>
                <Text style={s.statLabel}>{l}</Text>
              </View>
            ))}
          </Animated.View>

          {/* ── Swipeable Role Card ── */}
          <Animated.View style={[s.cardSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            {/* Section label + pip indicators */}
            <View style={s.cardHeader}>
              <Text style={s.cardHeaderLabel}>Kim olduğunu seç</Text>
              <View style={s.pips}>
                {ROLES.map((r, i) => (
                  <TouchableOpacity key={i} onPress={() => { hapticLight(); setActiveRole(i as 0 | 1); }} activeOpacity={0.7}>
                    <View style={[s.pip, { width: activeRole === i ? 22 : 7, backgroundColor: activeRole === i ? r.color : 'rgba(255,255,255,0.12)' }]} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* THE CARD */}
            <View
              {...panResponder.panHandlers}
              style={[s.roleCard, { borderColor: role.colorBorder, backgroundColor: role.colorDim }]}
            >
              {/* Top row */}
              <View style={s.roleCardTop}>
                <View>
                  <View style={s.roleCardTopRow}>
                    <Text style={s.roleEmoji}>{role.emoji}</Text>
                    <View style={[s.roleBadge, { backgroundColor: `${role.color}22`, borderColor: `${role.color}44` }]}>
                      <Text style={[s.roleBadgeText, { color: role.color }]}>{role.badge}</Text>
                    </View>
                  </View>
                  <Text style={s.roleTitle}>{role.title}</Text>
                  <Text style={[s.roleSubtitle, { color: `${role.color}99` }]}>{role.subtitle}</Text>
                </View>
                {/* Swipe hint */}
                <View style={s.swipeHint}>
                  <Text style={s.swipeArrow}>→</Text>
                  <Text style={s.swipeText}>Kaydır</Text>
                </View>
              </View>

              {/* Perks */}
              <View style={s.perksContainer}>
                {role.perks.map((p, i) => (
                  <View key={i} style={s.perkRow}>
                    <Text style={s.perkIcon}>{p.icon}</Text>
                    <Text style={s.perkText}>{p.text}</Text>
                  </View>
                ))}
              </View>

              {/* CTA inside card */}
              <TouchableOpacity
                onPress={() => {
                  if (role.id === 'player') { goTo('player_start'); }
                  else if (role.id === 'venue') { goTo('venue_start'); }
                  else { goTo('venue_staff_start'); }
                }}
                style={[s.cardCta, { backgroundColor: role.color, shadowColor: role.color }]}
                activeOpacity={0.85}
              >
                <Text style={s.cardCtaText}>
                  {role.id === 'player' ? 'Oyuncu Olarak Başla'
                    : role.id === 'venue' ? 'Saha Sahibi Olarak Başla'
                    : 'Personel Girişi Yap'}
                </Text>
                <Text style={s.cardCtaArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* ── Secondary Actions ── */}
            <TouchableOpacity
              onPress={() => navigation.navigate('PhoneAuth')}
              style={s.inviteBtn}
              activeOpacity={0.7}
            >
              <View style={s.inviteBtnIcon}>
                <Text style={s.inviteBtnIconText}>📱</Text>
              </View>
              <View style={s.inviteBtnContent}>
                <Text style={s.inviteBtnTitle}>Davet Koduyla Hızlı Gir</Text>
                <Text style={s.inviteBtnDesc}>Kaptan sana link attıysa buraya tıkla</Text>
              </View>
              <View style={s.inviteBtnBadge}>
                <Text style={s.inviteBtnBadgeText}>HIZLI</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={s.loginLink}
              activeOpacity={0.7}
            >
              <Text style={s.loginLinkText}>Zaten hesabım var, giriş yap</Text>
            </TouchableOpacity>

            {/* Terms */}
            <Text style={s.terms}>
              Devam ederek Kullanım Koşulları ve Gizlilik Politikası'nı kabul edersiniz.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════
  // PLAYER START
  // ══════════════════════════════════════════════════════════
  if (step === 'player_start') {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor="#060a0e" />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
          <Animated.View style={[s.subPage, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Back */}
            <TouchableOpacity onPress={() => goTo('hero')} style={s.backBtn} activeOpacity={0.7}>
              <Text style={s.backIcon}>‹</Text>
              <Text style={s.backText}>Geri</Text>
            </TouchableOpacity>

            {/* Header */}
            <Text style={s.subEmoji}>⚽</Text>
            <Text style={s.subHeadline}>
              Nasıl başlamak{'\n'}
              <Text style={{ color: '#10B981' }}>istiyorsun?</Text>
            </Text>
            <Text style={s.subDesc}>Giriş sonrası her şeye erişirsin — önce bir yol seç.</Text>

            {/* Path cards */}
            {PLAYER_FIRST_STEPS.map((path, i) => {
              const sel = selectedPath === i;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => { hapticLight(); setSelectedPath(i); }}
                  style={[
                    s.pathCard,
                    {
                      borderColor: sel
                        ? (path.highlight ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.3)')
                        : 'rgba(255,255,255,0.06)',
                      backgroundColor: sel
                        ? (path.highlight ? 'rgba(16,185,129,0.13)' : 'rgba(16,185,129,0.07)')
                        : 'rgba(255,255,255,0.02)',
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={s.pathCardInner}>
                    <View style={[s.pathIconBox, { backgroundColor: sel ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)' }]}>
                      <Text style={s.pathEmoji}>{path.emoji}</Text>
                      {path.highlight && (
                        <View style={s.pathHighlight}>
                          <Text style={s.pathHighlightArrow}>→</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.pathContent}>
                      <View style={s.pathTitleRow}>
                        <Text style={[s.pathLabel, sel && { color: 'white' }]}>{path.label}</Text>
                        {path.badge && (
                          <View style={[s.pathBadge, { backgroundColor: `${path.badgeColor}20` }]}>
                            <Text style={[s.pathBadgeText, { color: path.badgeColor }]}>{path.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.pathDesc}>{path.desc}</Text>
                    </View>
                    {/* Radio */}
                    <View style={[s.radio, sel && { borderColor: '#10B981', backgroundColor: '#10B981' }]}>
                      {sel && <View style={s.radioDot} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Hint */}
            <View style={s.hintBox}>
              <Text style={s.hintText}>
                💡 <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>Kod yok mu?</Text> "Takım Kur"u seç → kendi grubunu oluştur, arkadaşlarını WhatsApp'tan davet et.
              </Text>
            </View>

            <View style={{ flex: 1, minHeight: 20 }} />

            {/* CTA */}
            <TouchableOpacity
              onPress={() => {
                if (selectedPath === null) return;
                hapticLight();
                const path = PLAYER_FIRST_STEPS[selectedPath];
                navigation.navigate(path.screen as any, path.role ? { pendingRole: path.role } : undefined);
              }}
              disabled={selectedPath === null}
              style={[
                s.mainCta,
                {
                  backgroundColor: selectedPath !== null ? '#10B981' : 'rgba(255,255,255,0.04)',
                  shadowColor: '#10B981',
                  shadowOpacity: selectedPath !== null ? 0.4 : 0,
                },
              ]}
              activeOpacity={0.85}
            >
              <Text style={[s.mainCtaText, { color: selectedPath !== null ? '#060a0e' : 'rgba(255,255,255,0.15)' }]}>
                Devam Et {selectedPath !== null ? '→' : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.subLoginLink} activeOpacity={0.7}>
              <Text style={s.subLoginLinkText}>Hesabım var, giriş yap</Text>
            </TouchableOpacity>

            <Text style={s.terms}>
              Devam ederek Kullanım Koşulları ve Gizlilik Politikası'nı kabul edersiniz.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════
  // VENUE STAFF START
  // ══════════════════════════════════════════════════════════
  if (step === 'venue_staff_start') {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor="#060a0e" />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
          <Animated.View style={[s.subPage, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity onPress={() => goTo('hero')} style={s.backBtn} activeOpacity={0.7}>
              <Text style={s.backIcon}>‹</Text>
              <Text style={s.backText}>Geri</Text>
            </TouchableOpacity>

            <View style={s.venueHeaderRow}>
              <Text style={{ fontSize: 28 }}>👷</Text>
              <View style={[s.venueBadge, { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.35)' }]}>
                <Text style={[s.venueBadgeText, { color: '#8B5CF6' }]}>Personel</Text>
              </View>
            </View>

            <Text style={s.subHeadline}>
              Sahada{'\n'}
              <Text style={{ color: '#8B5CF6' }}>Çalışıyorum.</Text>
            </Text>
            <Text style={s.subDesc}>
              Saha yöneticisi, personel veya muhasebe olarak giriş yapın. Yetkilendirme saha sahibi tarafından yapılır.
            </Text>

            <View style={s.kpiRow}>
              {[['3 Rol', 'Yönetici / Personel / Muhasebe'], ['Anlık', 'Rezervasyon bildirimleri'], ['Güvenli', 'Rol bazlı erişim']].map(([v, l], i) => (
                <View key={i} style={s.kpiItem}>
                  <Text style={s.kpiValue}>{v}</Text>
                  <Text style={s.kpiLabel}>{l}</Text>
                </View>
              ))}
            </View>

            {[
              { icon: '📋', label: 'Rezervasyon Takibi', desc: 'Gelen rezervasyonları gör, onayla veya reddet' },
              { icon: '💳', label: 'EFT & Kasa', desc: 'Gelen ödemeleri ve kasa hareketlerini izle' },
              { icon: '📊', label: 'Gelir Raporları', desc: 'Muhasebe rolüyle finansal raporlara eriş' },
            ].map((f, i) => (
              <View key={i} style={s.featureRow}>
                <View style={[s.featureIconBox, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
                  <Text style={{ fontSize: 16 }}>{f.icon}</Text>
                </View>
                <View style={s.featureContent}>
                  <Text style={s.featureLabel}>{f.label}</Text>
                  <Text style={s.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}

            <View style={{ flex: 1, minHeight: 20 }} />

            <TouchableOpacity
              onPress={() => { hapticLight(); navigation.navigate('Login', { userType: 'venue_staff' }); }}
              style={[s.mainCta, { backgroundColor: '#8B5CF6', shadowColor: '#8B5CF6', shadowOpacity: 0.4 }]}
              activeOpacity={0.85}
            >
              <Text style={[s.mainCtaText, { color: 'white' }]}>Personel Girişi Yap →</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.subLoginLink} activeOpacity={0.7}>
              <Text style={s.subLoginLinkText}>Hesabım var, giriş yap</Text>
            </TouchableOpacity>

            <Text style={s.terms}>
              Devam ederek Kullanım Koşulları ve Gizlilik Politikası'nı kabul edersiniz.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════
  // VENUE START
  // ══════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#060a0e" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
        <Animated.View style={[s.subPage, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Back */}
          <TouchableOpacity onPress={() => goTo('hero')} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backIcon}>‹</Text>
            <Text style={s.backText}>Geri</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={s.venueHeaderRow}>
            <Text style={{ fontSize: 28 }}>🏟️</Text>
            <View style={s.venueBadge}>
              <Text style={s.venueBadgeText}>İş Ortağı</Text>
            </View>
          </View>
          <Text style={s.subHeadline}>
            Sahanı platforma{'\n'}
            <Text style={{ color: '#3B82F6' }}>bağla.</Text>
          </Text>
          <Text style={s.subDesc}>Tek hesap — tüm araçlar birlikte gelir, seçmen gerekmez.</Text>

          {/* KPIs */}
          <View style={s.kpiRow}>
            {[['850+', 'Aktif Saha'], ['5 dk', 'Kurulum'], ['%0', 'Komisyon']].map(([v, l], i) => (
              <View key={i} style={s.kpiItem}>
                <Text style={s.kpiValue}>{v}</Text>
                <Text style={s.kpiLabel}>{l}</Text>
              </View>
            ))}
          </View>

          {/* Features */}
          <Text style={s.featuresSectionLabel}>Pakete dahil — hepsi birden</Text>
          {VENUE_FEATURES.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <View style={s.featureIconBox}>
                <Text style={{ fontSize: 16 }}>{f.icon}</Text>
              </View>
              <View style={s.featureContent}>
                <Text style={s.featureLabel}>{f.label}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
              <View style={s.featureCheck}>
                <Text style={s.featureCheckText}>✓</Text>
              </View>
            </View>
          ))}

          <View style={{ flex: 1, minHeight: 20 }} />

          {/* CTAs */}
          <TouchableOpacity
            onPress={() => { hapticLight(); navigation.navigate('Login', { userType: 'venue_owner' }); }}
            style={[s.mainCta, { backgroundColor: '#3B82F6', shadowColor: '#3B82F6', shadowOpacity: 0.4 }]}
            activeOpacity={0.85}
          >
            <Text style={[s.mainCtaText, { color: 'white' }]}>Sahami Kaydet & Başla →</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.subLoginLink} activeOpacity={0.7}>
            <Text style={s.subLoginLinkText}>Hesabım var, giriş yap</Text>
          </TouchableOpacity>

          <Text style={s.terms}>
            Devam ederek Kullanım Koşulları ve Gizlilik Politikası'nı kabul edersiniz.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060a0e',
  },

  // ── Brand ──
  brandSection: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 4,
  },
  logoOuter: {
    marginBottom: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoStar: {
    fontSize: 32,
    color: 'white',
    opacity: 0.9,
  },
  wordmark: {
    fontSize: 52,
    fontWeight: '900',
    fontStyle: 'italic',
    color: 'white',
    letterSpacing: -2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 48,
  },
  wordmarkLine: {
    height: 2,
    borderRadius: 1,
    width: 120,
    marginTop: -2,
    opacity: 0.6,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 8,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.025)',
    overflow: 'hidden',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.06)',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '900',
    color: 'white',
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: 2,
  },

  // ── Card Section ──
  cardSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.2)',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  pips: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  pip: {
    height: 5,
    borderRadius: 3,
  },

  // ── Role Card ──
  roleCard: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 260,
    marginBottom: 12,
  },
  roleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 0,
  },
  roleCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  roleEmoji: {
    fontSize: 28,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  roleTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
  },
  roleSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  swipeHint: {
    alignItems: 'center',
    opacity: 0.3,
    marginTop: 4,
  },
  swipeArrow: {
    fontSize: 18,
    color: 'white',
    fontWeight: '300',
  },
  swipeText: {
    fontSize: 7,
    color: 'white',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },

  // ── Perks ──
  perksContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  perkIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  perkText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 16,
    flex: 1,
  },

  // ── Card CTA ──
  cardCta: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 13,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    shadowOpacity: 0.4,
    elevation: 6,
  },
  cardCtaText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#060a0e',
  },
  cardCtaArrow: {
    fontSize: 16,
    fontWeight: '300',
    color: '#060a0e',
  },

  // ── Invite Button ──
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(16,185,129,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
    marginBottom: 8,
  },
  inviteBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtnIconText: {
    fontSize: 14,
  },
  inviteBtnContent: {
    flex: 1,
  },
  inviteBtnTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#10B981',
  },
  inviteBtnDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    marginTop: 1,
  },
  inviteBtnBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  inviteBtnBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#10B981',
  },

  // ── Login Link ──
  loginLink: {
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  loginLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.2)',
  },

  // ── Terms ──
  terms: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.1)',
    textAlign: 'center',
    marginTop: 4,
    paddingBottom: 8,
  },

  // ═══ SUB PAGES (player_start / venue_start) ═══
  subPage: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  backIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    textAlign: 'center',
    lineHeight: 30,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 22,
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
  },

  subEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  subHeadline: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 8,
  },
  subDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    marginBottom: 20,
  },

  // ── Path Cards ──
  pathCard: {
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 8,
  },
  pathCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  pathIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathEmoji: {
    fontSize: 24,
  },
  pathHighlight: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathHighlightArrow: {
    fontSize: 8,
    fontWeight: '900',
    color: 'black',
  },
  pathContent: {
    flex: 1,
  },
  pathTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pathLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.45)',
  },
  pathBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 100,
  },
  pathBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  pathDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    marginTop: 2,
    lineHeight: 14,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#060a0e',
  },

  // ── Hint Box ──
  hintBox: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginTop: 8,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    lineHeight: 16,
  },

  // ── Main CTA ──
  mainCta: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 32,
    elevation: 6,
    marginBottom: 8,
  },
  mainCtaText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  subLoginLink: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  subLoginLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
  },

  // ── Venue Sub Page ──
  venueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  venueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  venueBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#60A5FA',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(59,130,246,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#60A5FA',
  },
  kpiLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.25)',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  featuresSectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.2)',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 6,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  featureDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    marginTop: 2,
  },
  featureCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCheckText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#60A5FA',
  },
});
