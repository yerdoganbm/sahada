/**
 * Captain Booking Flow Screen
 * Multi-step booking: venue → time slot → members → payment plan → success
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../theme';
import AppScrollView from '../components/AppScrollView';

type Step = 'venue' | 'slot' | 'members' | 'plan' | 'success';

const STEPS: Step[] = ['venue', 'slot', 'members', 'plan', 'success'];

const STEP_LABELS: Record<Step, string> = {
  venue: 'Saha Seçimi',
  slot: 'Saat Seçimi',
  members: 'Üye Seçimi',
  plan: 'Ödeme Planı',
  success: 'Onay',
};

const TIME_SLOTS = [
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
];

const VENUES = [
  { id: '1', name: 'Yıldız Halı Saha', location: 'Kadıköy', price: 800 },
  { id: '2', name: 'Gol Park Arena', location: 'Beşiktaş', price: 950 },
  { id: '3', name: 'Sahada Sports Center', location: 'Üsküdar', price: 700 },
  { id: '4', name: 'Maçka Spor Tesisi', location: 'Şişli', price: 1100 },
];

const PAYMENT_PLANS: { id: string; label: string; description: string; icon: string }[] = [
  { id: 'deposit_now', label: 'Kapora Öde', description: 'Şimdi kapora, kalanı maç günü', icon: 'cash-fast' },
  { id: 'all_eft', label: 'Tamamı EFT', description: 'Havale/EFT ile tamamını öde', icon: 'bank-transfer' },
  { id: 'all_cash', label: 'Nakit Ödeme', description: 'Maç günü nakit ödeme', icon: 'cash' },
  { id: 'pay_later', label: 'Sonra Öde', description: 'Ödemeyi sonraya bırak', icon: 'clock-outline' },
];

const MOCK_MEMBERS = [
  { id: '1', name: 'Ahmet Yılmaz', position: 'Forvet' },
  { id: '2', name: 'Mehmet Demir', position: 'Orta Saha' },
  { id: '3', name: 'Can Özkan', position: 'Defans' },
  { id: '4', name: 'Emre Kaya', position: 'Kaleci' },
  { id: '5', name: 'Burak Şahin', position: 'Orta Saha' },
  { id: '6', name: 'Serkan Aydın', position: 'Forvet' },
  { id: '7', name: 'Oğuz Çelik', position: 'Defans' },
  { id: '8', name: 'Deniz Arslan', position: 'Orta Saha' },
];

export default function CaptainBookingFlowScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>('venue');
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progressPercent = ((currentStepIndex + 1) / STEPS.length) * 100;

  const goNext = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1]);
    }
  };

  const goBack = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1]);
    } else {
      navigation.goBack();
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'venue':
        return !!selectedVenue;
      case 'slot':
        return !!selectedSlot && !!selectedDate;
      case 'members':
        return selectedMembers.length > 0;
      case 'plan':
        return !!selectedPlan;
      default:
        return false;
    }
  };

  const venue = VENUES.find((v) => v.id === selectedVenue);

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>
      <Text style={styles.stepLabel}>
        {currentStep !== 'success'
          ? `Adım ${currentStepIndex + 1}/${STEPS.length - 1} — ${STEP_LABELS[currentStep]}`
          : 'Rezervasyon Tamamlandı'}
      </Text>
    </View>
  );

  const renderVenueStep = () => (
    <View>
      <Text style={styles.stepTitle}>Saha Seçin</Text>
      <Text style={styles.stepDescription}>Maç için saha belirleyin</Text>
      {VENUES.map((v) => (
        <TouchableOpacity
          key={v.id}
          style={[styles.optionCard, selectedVenue === v.id && styles.optionCardActive]}
          onPress={() => setSelectedVenue(v.id)}
          activeOpacity={0.7}
        >
          <View style={styles.optionIconWrap}>
            <Icon name="soccer-field" size={24} color={selectedVenue === v.id ? colors.primary : colors.text.secondary} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>{v.name}</Text>
            <Text style={styles.optionSub}>{v.location}</Text>
          </View>
          <Text style={styles.optionPrice}>₺{v.price}</Text>
          {selectedVenue === v.id && (
            <Icon name="check-circle" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSlotStep = () => (
    <View>
      <Text style={styles.stepTitle}>Tarih & Saat</Text>
      <Text style={styles.stepDescription}>Maç günü ve saatini seçin</Text>

      <Text style={styles.fieldLabel}>Tarih</Text>
      <TouchableOpacity style={styles.dateInput}>
        <Icon name="calendar" size={20} color={colors.primary} />
        <TextInput
          style={styles.dateInputText}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.text.tertiary}
        />
      </TouchableOpacity>

      <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Saat Dilimi</Text>
      <View style={styles.slotsGrid}>
        {TIME_SLOTS.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[styles.slotChip, selectedSlot === slot && styles.slotChipActive]}
            onPress={() => setSelectedSlot(slot)}
            activeOpacity={0.7}
          >
            <Text style={[styles.slotChipText, selectedSlot === slot && styles.slotChipTextActive]}>
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMembersStep = () => (
    <View>
      <Text style={styles.stepTitle}>Üye Seçimi</Text>
      <Text style={styles.stepDescription}>
        Maça katılacak üyeleri seçin ({selectedMembers.length} seçili)
      </Text>
      {MOCK_MEMBERS.map((member) => {
        const isSelected = selectedMembers.includes(member.id);
        return (
          <TouchableOpacity
            key={member.id}
            style={[styles.memberRow, isSelected && styles.memberRowActive]}
            onPress={() => toggleMember(member.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.memberAvatar, isSelected && styles.memberAvatarActive]}>
              <Text style={styles.memberAvatarText}>
                {member.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberPos}>{member.position}</Text>
            </View>
            <Icon
              name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
              size={24}
              color={isSelected ? colors.primary : colors.text.tertiary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderPlanStep = () => (
    <View>
      <Text style={styles.stepTitle}>Ödeme Planı</Text>
      <Text style={styles.stepDescription}>
        {venue ? `${venue.name} — ₺${venue.price}` : 'Ödeme yöntemini seçin'}
      </Text>
      {PAYMENT_PLANS.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={[styles.optionCard, selectedPlan === plan.id && styles.optionCardActive]}
          onPress={() => setSelectedPlan(plan.id)}
          activeOpacity={0.7}
        >
          <View style={styles.optionIconWrap}>
            <Icon
              name={plan.icon as any}
              size={24}
              color={selectedPlan === plan.id ? colors.primary : colors.text.secondary}
            />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>{plan.label}</Text>
            <Text style={styles.optionSub}>{plan.description}</Text>
          </View>
          {selectedPlan === plan.id && (
            <Icon name="check-circle" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIconWrap}>
        <Icon name="check-circle" size={72} color={colors.success} />
      </View>
      <Text style={styles.successTitle}>Rezervasyon Oluşturuldu!</Text>
      <Text style={styles.successSub}>
        {venue?.name} — {selectedDate} {selectedSlot}
      </Text>
      <Text style={styles.successDetail}>
        {selectedMembers.length} üye davet edildi
      </Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Saha</Text>
          <Text style={styles.summaryValue}>{venue?.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tarih</Text>
          <Text style={styles.summaryValue}>{selectedDate}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Saat</Text>
          <Text style={styles.summaryValue}>{selectedSlot}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ödeme</Text>
          <Text style={styles.summaryValue}>
            {PAYMENT_PLANS.find((p) => p.id === selectedPlan)?.label}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tutar</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>
            ₺{venue?.price}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryBtnText}>Ana Sayfaya Dön</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'venue':
        return renderVenueStep();
      case 'slot':
        return renderSlotStep();
      case 'members':
        return renderMembersStep();
      case 'plan':
        return renderPlanStep();
      case 'success':
        return renderSuccess();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saha Rezervasyonu</Text>
        <View style={styles.placeholder} />
      </View>

      {renderStepIndicator()}

      <AppScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderCurrentStep()}
      </AppScrollView>

      {/* Bottom Action */}
      {currentStep !== 'success' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryBtn, !canProceed() && styles.primaryBtnDisabled]}
            onPress={goNext}
            disabled={!canProceed()}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>
              {currentStep === 'plan' ? 'Rezervasyonu Onayla' : 'Devam Et'}
            </Text>
            <Icon name="arrow-right" size={20} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  placeholder: { width: 40 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  scrollContent: { paddingBottom: 120 },
  // Step indicator
  stepIndicator: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  stepLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    letterSpacing: 1,
  },
  // Step content
  stepTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  stepDescription: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  // Option cards (venue, plan)
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}12`,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionInfo: { flex: 1 },
  optionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  optionSub: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  optionPrice: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  // Date input
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.sm,
  },
  dateInputText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  // Time slots
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  slotChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotChipText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  slotChipTextActive: {
    color: colors.secondary,
  },
  // Members
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  memberRowActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}12`,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  memberAvatarActive: {
    backgroundColor: `${colors.primary}30`,
  },
  memberAvatarText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  memberInfo: { flex: 1 },
  memberName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  memberPos: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  // Success
  successContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  successIconWrap: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  successSub: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  successDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  // Bottom bar
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
});
