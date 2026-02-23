/**
 * SubscriptionScreen – Güzel plan kartları ile abonelik ekranı
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

type SubscriptionNavProp = StackNavigationProp<RootStackParamList, 'Subscription'>;

const { width: SW } = Dimensions.get('window');

interface Plan {
  id: string;
  tier: 'free' | 'premium' | 'partner';
  name: string;
  subtitle: string;
  price: string;
  period: string;
  icon: string;
  color: string;
  gradient: [string, string];
  features: { text: string; available: boolean }[];
  cta: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    tier: 'free',
    name: 'Starter',
    subtitle: 'Temel özellikler',
    price: 'Ücretsiz',
    period: '',
    icon: 'soccer',
    color: '#64748B',
    gradient: ['#1E293B', '#0F172A'],
    features: [
      { text: 'Maç takibi (aylık 5)', available: true },
      { text: 'Takım kadrosu görüntüleme', available: true },
      { text: 'Profil ve istatistikler', available: true },
      { text: 'RSVP katılım bildirimi', available: true },
      { text: 'Saha rezervasyonu', available: false },
      { text: 'Gelişmiş istatistikler', available: false },
      { text: 'Kadro paylaşımı', available: false },
      { text: 'Takım sohbeti', available: false },
    ],
    cta: 'Mevcut Plan',
  },
  {
    id: 'premium',
    tier: 'premium',
    name: 'Pro Baller',
    subtitle: 'En popüler seçim',
    price: '₺149',
    period: '/ay',
    icon: 'star-circle',
    color: '#10B981',
    gradient: ['#064e3b', '#022c22'],
    features: [
      { text: 'Sınırsız maç takibi', available: true },
      { text: 'Takım kadrosu yönetimi', available: true },
      { text: 'Gelişmiş istatistikler & rating', available: true },
      { text: 'Kadro oluştur & paylaş', available: true },
      { text: 'Saha rezervasyonu', available: true },
      { text: 'Takım sohbeti & mesajlaşma', available: true },
      { text: 'Turnuva modülü', available: true },
      { text: 'WhatsApp entegrasyonu', available: false },
    ],
    cta: 'Pro\'ya Yükselt',
    popular: true,
  },
  {
    id: 'partner',
    tier: 'partner',
    name: 'Saha Partner',
    subtitle: 'Tesis sahipleri için',
    price: '₺499',
    period: '/ay',
    icon: 'crown',
    color: '#F59E0B',
    gradient: ['#451a03', '#1c0a00'],
    features: [
      { text: 'Tüm Pro özellikler', available: true },
      { text: 'Tesis yönetim paneli', available: true },
      { text: 'Rezervasyon yönetimi', available: true },
      { text: 'Gelir/gider raporları', available: true },
      { text: 'WhatsApp entegrasyonu', available: true },
      { text: 'Müşteri yönetimi CRM', available: true },
      { text: 'Özel analitik dashboard', available: true },
      { text: 'Öncelikli destek', available: true },
    ],
    cta: 'Partner Ol',
  },
];

export default function SubscriptionScreen() {
  const navigation = useNavigation<SubscriptionNavProp>();
  const { user } = useAuth();
  const currentTier = (user?.role === 'admin' ? 'partner' : user?.tier) ?? 'free';
  const [annual, setAnnual] = useState(false);

  const handleSubscribe = (plan: Plan) => {
    if (plan.tier === currentTier) return;
    if (plan.tier === 'free') {
      Alert.alert('Mevcut plan', 'Halihazırda Starter planındasınız.');
      return;
    }
    Alert.alert(
      `${plan.name} Planı`,
      `${plan.price}${plan.period} ile ${plan.name} planına geçmek istiyor musunuz?\n\nBu özellik yakında aktif olacak.`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Devam Et', onPress: () => {} },
      ]
    );
  };

  const annualDiscount = (price: string) => {
    const n = parseInt(price.replace(/\D/g, ''));
    if (!n) return price;
    return `₺${Math.round(n * 10)}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Abonelik</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Icon name="crown" size={14} color={colors.warning} />
            <Text style={styles.heroBadgeText}>Premium deneyim</Text>
          </View>
          <Text style={styles.heroTitle}>Sahada'yı{'\n'}tam açıkla</Text>
          <Text style={styles.heroSub}>
            Daha iyi maç yönetimi, gelişmiş istatistikler ve sınırsız özellikler.
          </Text>
        </View>

        {/* Annual Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, !annual && styles.toggleBtnActive]}
            onPress={() => setAnnual(false)}
          >
            <Text style={[styles.toggleText, !annual && styles.toggleTextActive]}>Aylık</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, annual && styles.toggleBtnActive]}
            onPress={() => setAnnual(true)}
          >
            <Text style={[styles.toggleText, annual && styles.toggleTextActive]}>Yıllık</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>%17 İndirim</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Current Plan Badge */}
        <View style={styles.currentPlanRow}>
          <Icon name="check-circle" size={16} color={colors.primary} />
          <Text style={styles.currentPlanText}>
            Mevcut plan: <Text style={{ color: colors.primary, fontWeight: '700' }}>
              {currentTier === 'free' ? 'Starter' : currentTier === 'premium' ? 'Pro Baller' : 'Saha Partner'}
            </Text>
          </Text>
        </View>

        {/* Plan Cards */}
        {PLANS.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          const displayPrice = annual && plan.price !== 'Ücretsiz' ? annualDiscount(plan.price) : plan.price;
          const displayPeriod = annual && plan.period ? '/yıl' : plan.period;

          return (
            <View key={plan.id} style={[styles.card, isCurrent && styles.cardCurrent, plan.popular && styles.cardPopular]}>
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Icon name="fire" size={12} color="#fff" />
                  <Text style={styles.popularBadgeText}>EN POPÜLER</Text>
                </View>
              )}
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>✓ MEVCUT PLAN</Text>
                </View>
              )}

              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={[styles.planIconWrap, { backgroundColor: `${plan.color}22` }]}>
                  <Icon name={plan.icon as any} size={28} color={plan.color} />
                </View>
                <View style={styles.planTitleWrap}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
                </View>
                <View style={styles.priceWrap}>
                  <Text style={[styles.planPrice, { color: plan.color }]}>{displayPrice}</Text>
                  {displayPeriod ? <Text style={styles.planPeriod}>{displayPeriod}</Text> : null}
                </View>
              </View>

              {/* Features */}
              <View style={styles.featureList}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Icon
                      name={f.available ? 'check-circle' : 'close-circle'}
                      size={16}
                      color={f.available ? plan.color : colors.text.disabled}
                    />
                    <Text style={[styles.featureText, !f.available && styles.featureTextDisabled]}>
                      {f.text}
                    </Text>
                  </View>
                ))}
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={[
                  styles.ctaBtn,
                  isCurrent && styles.ctaBtnCurrent,
                  !isCurrent && { backgroundColor: plan.color },
                ]}
                onPress={() => handleSubscribe(plan)}
                disabled={isCurrent}
              >
                <Text style={[styles.ctaText, isCurrent && styles.ctaTextCurrent]}>
                  {isCurrent ? '✓ Aktif Plan' : plan.cta}
                </Text>
                {!isCurrent && <Icon name="arrow-right" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* FAQ / Info */}
        <View style={styles.infoCard}>
          <Icon name="shield-check" size={24} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.infoTitle}>Güvenli Ödeme</Text>
            <Text style={styles.infoText}>
              Tüm ödemeler SSL ile şifrelenir. İstediğiniz zaman iptal edebilirsiniz.
            </Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  scrollContent: { paddingBottom: 32 },
  // Hero
  hero: { padding: spacing.xl, paddingBottom: spacing.lg, alignItems: 'center' },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    gap: 6,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  heroBadgeText: { fontSize: typography.fontSize.xs, fontWeight: '700', color: colors.warning, letterSpacing: 0.5 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: colors.text.primary, textAlign: 'center', lineHeight: 40, marginBottom: spacing.sm },
  heroSub: { fontSize: typography.fontSize.md, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  // Toggle
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: 4,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.lg, gap: 8 },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text.secondary },
  toggleTextActive: { color: '#fff' },
  saveBadge: { backgroundColor: '#FEF3C7', borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  saveBadgeText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  // Current
  currentPlanRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  currentPlanText: { fontSize: typography.fontSize.sm, color: colors.text.secondary },
  // Cards
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    position: 'relative',
    overflow: 'hidden',
  },
  cardCurrent: { borderColor: colors.primary, borderWidth: 2 },
  cardPopular: { borderColor: '#10B981', borderWidth: 2 },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popularBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  currentBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  currentBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, paddingTop: 4 },
  planIconWrap: { width: 52, height: 52, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  planTitleWrap: { flex: 1, marginLeft: spacing.md },
  planName: { fontSize: 18, fontWeight: '800', color: colors.text.primary },
  planSubtitle: { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  priceWrap: { alignItems: 'flex-end' },
  planPrice: { fontSize: 22, fontWeight: '800' },
  planPeriod: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  featureList: { marginBottom: spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  featureText: { fontSize: typography.fontSize.sm, color: colors.text.primary, flex: 1 },
  featureTextDisabled: { color: colors.text.disabled },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  ctaBtnCurrent: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border.light },
  ctaText: { fontSize: typography.fontSize.md, fontWeight: '700', color: '#fff' },
  ctaTextCurrent: { color: colors.text.secondary },
  // Info
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  infoTitle: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },
  infoText: { fontSize: typography.fontSize.xs, color: colors.text.secondary, lineHeight: 18 },
});
