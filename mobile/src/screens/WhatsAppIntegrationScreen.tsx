/**
 * WhatsAppIntegrationScreen – WhatsApp paylaşım şablonları ve bildirim ayarları
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import AlertModal from '../components/AlertModal';

type WhatsAppNavProp = StackNavigationProp<RootStackParamList, 'WhatsAppIntegration'>;

// ─────────────────────────────────────────
// WhatsApp deep-link gönderici
// ─────────────────────────────────────────
const sendToWhatsApp = async (phone: string, message: string) => {
  const encoded = encodeURIComponent(message);
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    Alert.alert('WhatsApp Bulunamadı', 'Cihazınızda WhatsApp yüklü olmalıdır.');
    return;
  }
  Linking.openURL(url);
};

const shareToWhatsApp = async (message: string) => {
  const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    Alert.alert('WhatsApp Bulunamadı', 'Cihazınızda WhatsApp yüklü olmalıdır.');
    return;
  }
  Linking.openURL(url);
};

// ─────────────────────────────────────────
// Şablon tipi
// ─────────────────────────────────────────
interface Template {
  id: string;
  title: string;
  icon: string;
  color: string;
  generate: () => string;
}

export default function WhatsAppIntegrationScreen() {
  const navigation = useNavigation<WhatsAppNavProp>();
  const { user, updateUser } = useAuth();
  const [enabled, setEnabled] = useState(user?.whatsappEnabled ?? false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'error' | 'success';
  } | null>(null);
  const [targetPhone, setTargetPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

  const templates: Template[] = [
    {
      id: 'match_reminder',
      title: 'Maç Hatırlatması',
      icon: 'soccer',
      color: '#10B981',
      generate: () =>
        `⚽ *MAÇ HATIRLATMASI*\n\n📅 Tarih: ${today}\n🕗 Saat: 20:00\n📍 Saha: Kuzey Spor Tesisi\n\n✅ Geleceksen *EVET*, ❌ gelmeyeceksen *HAYIR* yaz!\n\n_Sahada Uygulaması_`,
    },
    {
      id: 'payment_reminder',
      title: 'Aidat Hatırlatması',
      icon: 'cash',
      color: '#F59E0B',
      generate: () =>
        `💰 *AİDAT HATIRLATMASI*\n\nMerhaba! Bu ay aidat ödemesi henüz yapılmamış.\n\n💳 Tutar: ₺150\n📆 Son Ödeme: Ayın 15'i\n\n📱 Sahada uygulamasından ödeme dekontunuzu yükleyebilirsiniz.\n\n_Sahada Uygulaması_`,
    },
    {
      id: 'squad_share',
      title: 'Kadro Paylaşımı',
      icon: 'account-group',
      color: '#3B82F6',
      generate: () =>
        `🟢 *MAÇIN KADROSU*\n\n📅 ${today}\n\n1. Kaleci\n2. Defans 1\n3. Defans 2\n4. Defans 3\n5. Orta Saha 1\n6. Orta Saha 2\n7. Orta Saha 3\n8. Forvet 1\n9. Forvet 2\n\nYedekler:\n10. Oyuncu 1\n11. Oyuncu 2\n\nKadroyu Sahada'da gör 📱`,
    },
    {
      id: 'match_result',
      title: 'Maç Sonucu',
      icon: 'trophy',
      color: '#8B5CF6',
      generate: () =>
        `🏆 *MAÇ SONUCU*\n\n⚽ Kuzey Yıldızları FC 6 - 4 Rakip\n📅 ${today}\n\n⭐ Maçın En İyisi: Oyuncu Adı\n🥅 Goller: Oyuncu (3), Oyuncu (2), Oyuncu (1)\n\nHarika bir maçtı! Tebrikler ekip! 🎉\n\n_Sahada Uygulaması_`,
    },
    {
      id: 'venue_booking',
      title: 'Saha Rezervasyonu',
      icon: 'domain',
      color: '#14B8A6',
      generate: () =>
        `📍 *SAHA REZERVASYONU*\n\n🏟️ Saha: Kuzey Spor Tesisi\n📅 Tarih: ${today}\n🕗 Saat: 20:00 - 21:00\n👥 Kişi Başı: ₺150\n\n✅ Rezervasyon onaylandı!\n\nGecikmeyin! ⏰\n\n_Sahada Uygulaması_`,
    },
    {
      id: 'join_invite',
      title: 'Takıma Davet',
      icon: 'account-plus',
      color: '#EC4899',
      generate: () =>
        `⚽ *TAKIMA KATIL!*\n\nMerhaba!\n\nSeni takımımıza davet ediyoruz. Sahada uygulamasını indirip bu kod ile katılabilirsin:\n\n🔑 Davet Kodu: *${user?.teamId?.slice(0, 8)?.toUpperCase() || 'KYF-2024'}*\n\n📱 Uygulama: Sahada\n\nGörüşürüz sahada! ⚽`,
    },
  ];

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    setSaving(true);
    try {
      await updateUser({ whatsappEnabled: value });
      setAlert({
        title: 'Kaydedildi',
        message: value ? 'WhatsApp bildirimleri açıldı.' : 'WhatsApp bildirimleri kapatıldı.',
        type: 'success',
      });
    } catch (err) {
      setEnabled(!value);
      setAlert({
        title: 'Hata',
        message: (err as Error).message ?? 'Ayarlar kaydedilemedi.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTemplate = useCallback(
    (template: Template) => {
      const msg = template.generate();
      if (targetPhone.trim()) {
        sendToWhatsApp(targetPhone.trim(), msg);
      } else {
        shareToWhatsApp(msg);
      }
    },
    [targetPhone]
  );

  const handleSendCustom = () => {
    if (!customMessage.trim()) return;
    if (targetPhone.trim()) {
      sendToWhatsApp(targetPhone.trim(), customMessage.trim());
    } else {
      shareToWhatsApp(customMessage.trim());
    }
  };

  return (
    <>
      <AlertModal
        visible={!!alert}
        title={alert?.title ?? ''}
        message={alert?.message ?? ''}
        type={alert?.type ?? 'info'}
        onConfirm={() => setAlert(null)}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>WhatsApp Entegrasyonu</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Notification Toggle */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: '#25D36618' }]}>
                <Icon name="whatsapp" size={26} color="#25D366" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>WhatsApp Bildirimleri</Text>
                <Text style={styles.cardDesc}>Maç, ödeme ve takım güncellemelerini al</Text>
              </View>
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Switch
                  value={enabled}
                  onValueChange={handleToggle}
                  trackColor={{ false: colors.background.tertiary, true: `${colors.primary}80` }}
                  thumbColor={enabled ? colors.primary : colors.text.tertiary}
                />
              )}
            </View>
            {!user?.phone && (
              <View style={styles.warn}>
                <Icon name="information" size={16} color={colors.warning} />
                <Text style={styles.warnText}>Bildirim için profilde telefon numarası olmalı.</Text>
              </View>
            )}
          </View>

          {/* Target Phone */}
          <Text style={styles.sectionTitle}>HEDEF NUMARA (OPSİYONEL)</Text>
          <View style={styles.phoneInputWrap}>
            <Icon name="phone" size={18} color={colors.text.tertiary} />
            <TextInput
              style={styles.phoneInput}
              value={targetPhone}
              onChangeText={setTargetPhone}
              placeholder="905XXXXXXXXX (boş bırakırsan WhatsApp açılır)"
              placeholderTextColor={colors.text.disabled}
              keyboardType="phone-pad"
            />
          </View>

          {/* Templates */}
          <Text style={styles.sectionTitle}>MESAJ ŞABLONLARI</Text>
          <Text style={styles.sectionHint}>Bir şablona dokun → WhatsApp'ta aç</Text>

          {templates.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.templateCard}
              onPress={() => handleSendTemplate(t)}
              activeOpacity={0.7}
            >
              <View style={[styles.templateIcon, { backgroundColor: `${t.color}18` }]}>
                <Icon name={t.icon as any} size={24} color={t.color} />
              </View>
              <View style={styles.templateInfo}>
                <Text style={styles.templateTitle}>{t.title}</Text>
                <Text style={styles.templatePreview} numberOfLines={1}>
                  {t.generate().replace(/\*/g, '').replace(/\n/g, ' ').slice(0, 60)}...
                </Text>
              </View>
              <Icon name="send" size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          ))}

          {/* Custom Message */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>ÖZEL MESAJ</Text>
          <TextInput
            style={styles.customInput}
            value={customMessage}
            onChangeText={setCustomMessage}
            placeholder="Kendi mesajını yaz..."
            placeholderTextColor={colors.text.disabled}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity
            style={[styles.sendCustomBtn, !customMessage.trim() && styles.sendCustomBtnDisabled]}
            onPress={handleSendCustom}
            disabled={!customMessage.trim()}
          >
            <Icon name="whatsapp" size={20} color="#fff" />
            <Text style={styles.sendCustomText}>WhatsApp'ta Gönder</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </>
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
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  content: { flex: 1, padding: spacing.lg },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: colors.text.tertiary, letterSpacing: 1.5, marginBottom: 6, marginTop: spacing.lg },
  sectionHint: { fontSize: typography.fontSize.xs, color: colors.text.disabled, marginBottom: spacing.md },
  // Toggle Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: { width: 48, height: 48, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary },
  cardDesc: { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: borderRadius.md, padding: spacing.sm },
  warnText: { fontSize: typography.fontSize.xs, color: colors.text.secondary, flex: 1 },
  // Phone Input
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  phoneInput: { flex: 1, fontSize: typography.fontSize.sm, color: colors.text.primary },
  // Template Cards
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.md,
  },
  templateIcon: { width: 48, height: 48, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  templateInfo: { flex: 1 },
  templateTitle: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary },
  templatePreview: { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  // Custom
  customInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  sendCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  sendCustomBtnDisabled: { opacity: 0.5 },
  sendCustomText: { fontSize: typography.fontSize.md, fontWeight: '700', color: '#fff' },
});
