/**
 * MemberMatchHubScreen – Uye mac + odeme tek ekran
 * Mac bilgisi, RSVP butonlari, IBAN, dekont yukleme, kaptan mesaj sablonu.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AppScrollView from '../components/AppScrollView';
import PaymentProofModal, { type ProofSubmitPayload } from '../components/PaymentProofModal';
import { colors, spacing, borderRadius, typography } from '../theme';

type RsvpStatus = 'yes' | 'maybe' | 'no' | null;

const RSVP_CONFIG: { key: RsvpStatus & string; label: string; icon: string; color: string; bgColor: string }[] = [
  { key: 'yes', label: 'Geliyorum', icon: 'check-circle', color: '#10B981', bgColor: '#10B98120' },
  { key: 'maybe', label: 'Belki', icon: 'help-circle', color: '#F59E0B', bgColor: '#F59E0B20' },
  { key: 'no', label: 'Gelemiyorum', icon: 'close-circle', color: '#EF4444', bgColor: '#EF444420' },
];

const MOCK_IBAN = {
  holder: 'Mehmet Kaptan',
  bank: 'Ziraat Bankasi',
  iban: 'TR12 0001 2345 6789 0123 4567 89',
};

const MOCK_MESSAGE_TEMPLATE = `Merhaba, {tarih} tarihindeki macimiz icin {tutar} TL odemenizi bekliyoruz. IBAN: {iban} - Lutfen aciklama kismina adinizi yaziniz.`;

export default function MemberMatchHubScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [rsvp, setRsvp] = useState<RsvpStatus>(null);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);

  const handleRsvp = (status: RsvpStatus) => {
    setRsvp(status);
  };

  const handleCopyIban = () => {
    Clipboard.setString(MOCK_IBAN.iban);
    Alert.alert('Kopyalandi', 'IBAN panoya kopyalandi.');
  };

  const handleProofSubmit = async (payload: ProofSubmitPayload) => {
    setProofUploaded(true);
    Alert.alert(
      'Gönderildi',
      `₺${payload.amount} ${payload.method} ödemesi kaydedildi.${payload.proofUri ? '\nDekont yüklendi.' : ''}`,
    );
  };

  const handleCopyMessage = () => {
    const message = MOCK_MESSAGE_TEMPLATE
      .replace('{tarih}', '05 Mart 2025')
      .replace('{tutar}', '150')
      .replace('{iban}', MOCK_IBAN.iban);
    Clipboard.setString(message);
    Alert.alert('Kopyalandi', 'Mesaj sablonu panoya kopyalandi.');
  };

  const getRsvpBorderColor = () => {
    if (!rsvp) return colors.border.light;
    const config = RSVP_CONFIG.find((r) => r.key === rsvp);
    return config ? config.color : colors.border.light;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mac Detayi</Text>
        <View style={{ width: 40 }} />
      </View>

      <AppScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={true}
      >
        {/* Match Info Card */}
        <View style={[styles.matchCard, { borderColor: getRsvpBorderColor() }]}>
          <View style={styles.matchHeader}>
            <View style={styles.matchIconContainer}>
              <Icon name="soccer" size={28} color={colors.primary} />
            </View>
            <View style={styles.matchInfo}>
              <Text style={styles.matchVenue}>Yildiz Halisaha</Text>
              <Text style={styles.matchAddress}>Kadikoy, Istanbul</Text>
            </View>
          </View>

          <View style={styles.matchDetails}>
            <View style={styles.matchDetailItem}>
              <Icon name="calendar" size={16} color={colors.text.tertiary} />
              <Text style={styles.matchDetailText}>05 Mart 2025</Text>
            </View>
            <View style={styles.matchDetailItem}>
              <Icon name="clock-outline" size={16} color={colors.text.tertiary} />
              <Text style={styles.matchDetailText}>20:00 - 21:00</Text>
            </View>
            <View style={styles.matchDetailItem}>
              <Icon name="account-group" size={16} color={colors.text.tertiary} />
              <Text style={styles.matchDetailText}>7v7</Text>
            </View>
            <View style={styles.matchDetailItem}>
              <Icon name="cash" size={16} color={colors.text.tertiary} />
              <Text style={styles.matchDetailText}>150 TL / kisi</Text>
            </View>
          </View>

          {/* RSVP indicator */}
          {rsvp && (
            <View style={[styles.rsvpIndicator, { backgroundColor: RSVP_CONFIG.find((r) => r.key === rsvp)?.bgColor }]}>
              <Icon
                name={RSVP_CONFIG.find((r) => r.key === rsvp)?.icon as any}
                size={16}
                color={RSVP_CONFIG.find((r) => r.key === rsvp)?.color}
              />
              <Text style={[styles.rsvpIndicatorText, { color: RSVP_CONFIG.find((r) => r.key === rsvp)?.color }]}>
                {RSVP_CONFIG.find((r) => r.key === rsvp)?.label}
              </Text>
            </View>
          )}
        </View>

        {/* RSVP Section */}
        <Text style={styles.sectionLabel}>KATILIM DURUMU</Text>
        <View style={styles.rsvpRow}>
          {RSVP_CONFIG.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.rsvpBtn,
                {
                  backgroundColor: rsvp === option.key ? option.bgColor : colors.surface,
                  borderColor: rsvp === option.key ? option.color : colors.border.light,
                },
              ]}
              onPress={() => handleRsvp(option.key as RsvpStatus)}
            >
              <Icon
                name={option.icon as any}
                size={24}
                color={rsvp === option.key ? option.color : colors.text.tertiary}
              />
              <Text
                style={[
                  styles.rsvpBtnText,
                  { color: rsvp === option.key ? option.color : colors.text.secondary },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* IBAN Section */}
        <Text style={styles.sectionLabel}>ODEME BILGILERI</Text>
        <View style={styles.ibanCard}>
          <View style={styles.ibanHeader}>
            <View style={styles.ibanIcon}>
              <Icon name="bank" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ibanHolder}>{MOCK_IBAN.holder}</Text>
              <Text style={styles.ibanBank}>{MOCK_IBAN.bank}</Text>
            </View>
          </View>

          <View style={styles.ibanRow}>
            <Text style={styles.ibanValue}>{MOCK_IBAN.iban}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyIban}>
              <Icon name="content-copy" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Proof Upload */}
        <Text style={styles.sectionLabel}>ÖDEME GÖNDER</Text>
        <View style={styles.uploadCard}>
          {proofUploaded ? (
            <View style={styles.uploadSuccess}>
              <Icon name="check-circle" size={48} color={colors.success} />
              <Text style={styles.uploadSuccessText}>Ödeme gönderildi</Text>
              <Text style={styles.uploadSuccessSub}>Kaptan onayınızı bekleyin</Text>
              <TouchableOpacity
                style={styles.sendAnotherBtn}
                onPress={() => setProofModalVisible(true)}
                activeOpacity={0.7}
              >
                <Icon name="plus" size={16} color={colors.primary} />
                <Text style={styles.sendAnotherText}>Yeni Ödeme Ekle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => setProofModalVisible(true)}
            >
              <Icon name="send" size={36} color={colors.primary} />
              <Text style={styles.uploadBtnText}>Ödeme / Dekont Gönder</Text>
              <Text style={styles.uploadBtnSub}>Nakit, EFT, kart — kamera veya galeriden dekont ekle</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Captain Message Template */}
        <Text style={styles.sectionLabel}>KAPTAN MESAJ SABLONU</Text>
        <View style={styles.messageCard}>
          <View style={styles.messageHeader}>
            <Icon name="message-text" size={18} color={colors.info} />
            <Text style={styles.messageTitle}>WhatsApp Mesaji</Text>
          </View>
          <Text style={styles.messageBody}>
            {MOCK_MESSAGE_TEMPLATE
              .replace('{tarih}', '05 Mart 2025')
              .replace('{tutar}', '150')
              .replace('{iban}', MOCK_IBAN.iban)}
          </Text>
          <TouchableOpacity style={styles.copyMessageBtn} onPress={handleCopyMessage}>
            <Icon name="content-copy" size={16} color={colors.primary} />
            <Text style={styles.copyMessageText}>Mesaji Kopyala</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Icon name="information-outline" size={18} color={colors.info} />
          <Text style={styles.infoText}>
            Odemenizi yaptiktan sonra dekontunuzu yukleyin. Kaptan onayladiginda odemeniz tamamlanmis sayilacaktir.
          </Text>
        </View>
      </AppScrollView>

      {/* Payment Proof Modal */}
      <PaymentProofModal
        visible={proofModalVisible}
        onClose={() => setProofModalVisible(false)}
        onSubmit={handleProofSubmit}
        expectedAmount={150}
        paidAmount={0}
        reservationLabel="Yıldız Halısaha · 05 Mart"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  // Scroll
  scrollContent: { flex: 1 },
  scrollInner: { padding: spacing.lg, paddingBottom: 100 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  // Match card
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  matchIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  matchInfo: { flex: 1 },
  matchVenue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  matchAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  matchDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  matchDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchDetailText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  rsvpIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  rsvpIndicatorText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  // RSVP buttons
  rsvpRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rsvpBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  rsvpBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  // IBAN
  ibanCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  ibanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ibanIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  ibanHolder: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.text.primary,
  },
  ibanBank: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  ibanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  ibanValue: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}18`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Upload
  uploadCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  uploadBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  sendAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: `${colors.primary}12`,
    borderWidth: 1,
    borderColor: `${colors.primary}25`,
  },
  sendAnotherText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  uploadBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  uploadBtnSub: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  uploadSuccess: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  uploadSuccessText: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.success,
    marginTop: spacing.md,
  },
  uploadSuccessSub: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  // Message template
  messageCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  messageTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.text.primary,
  },
  messageBody: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  copyMessageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
  },
  copyMessageText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  // Info card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.info}10`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.info}25`,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
