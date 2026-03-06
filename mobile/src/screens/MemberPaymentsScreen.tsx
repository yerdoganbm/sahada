/**
 * Member Payments Screen
 * Payment summary, filter tabs, contribution list, IBAN copy, proof upload modal, proof history
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../theme';
import AppScrollView from '../components/AppScrollView';
import PaymentProofModal, { type ProofSubmitPayload } from '../components/PaymentProofModal';
import type { ProofEntry } from '../types';

type PaymentStatus = 'paid' | 'partial' | 'unpaid';
type FilterType = 'all' | 'unpaid' | 'partial' | 'paid';

interface PaymentContribution {
  id: string;
  label: string;
  amount: number;
  paidAmount: number;
  status: PaymentStatus;
  dueDate: string;
  description?: string;
  proofHistory?: ProofEntry[];
}

const MOCK_IBAN = 'TR33 0006 1005 1978 6457 8413 26';

const MOCK_PAYMENTS: PaymentContribution[] = [
  {
    id: '1', label: 'Ocak Aidatı', amount: 200, paidAmount: 200, status: 'paid',
    dueDate: '2024-01-31', description: 'Aylık takım aidatı',
    proofHistory: [
      { id: 'p1', url: '', type: 'image', method: 'eft', amount: 200, submittedAt: '2024-01-28T14:30:00Z', status: 'approved', note: 'Havale yapıldı' },
    ],
  },
  {
    id: '2', label: 'Şubat Aidatı', amount: 200, paidAmount: 100, status: 'partial',
    dueDate: '2024-02-28', description: 'Aylık takım aidatı',
    proofHistory: [
      { id: 'p2', url: '', type: 'image', method: 'eft', amount: 100, submittedAt: '2024-02-15T10:00:00Z', status: 'approved' },
    ],
  },
  { id: '3', label: 'Mart Aidatı', amount: 200, paidAmount: 0, status: 'unpaid', dueDate: '2024-03-31', description: 'Aylık takım aidatı' },
  { id: '4', label: 'Saha Kirası (15 Ocak)', amount: 120, paidAmount: 120, status: 'paid', dueDate: '2024-01-15' },
  { id: '5', label: 'Saha Kirası (22 Ocak)', amount: 120, paidAmount: 0, status: 'unpaid', dueDate: '2024-01-22' },
  {
    id: '6', label: 'Forma Ücreti', amount: 150, paidAmount: 75, status: 'partial',
    dueDate: '2024-02-15', description: 'Sezon forması',
    proofHistory: [
      { id: 'p3', url: '', type: 'link', method: 'card', amount: 75, submittedAt: '2024-02-10T09:00:00Z', status: 'pending' },
    ],
  },
];

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'unpaid', label: 'Ödenmemiş' },
  { key: 'partial', label: 'Kısmi' },
  { key: 'paid', label: 'Ödendi' },
];

export default function MemberPaymentsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentContribution | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const filteredPayments = MOCK_PAYMENTS.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const totalAmount = MOCK_PAYMENTS.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = MOCK_PAYMENTS.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalRemaining = totalAmount - totalPaid;

  const handleCopyIban = async () => {
    try {
      await Clipboard.setStringAsync(MOCK_IBAN.replace(/\s/g, ''));
      Alert.alert('Kopyalandı', 'IBAN panoya kopyalandı.');
    } catch {
      Alert.alert('Hata', 'IBAN kopyalanamadı.');
    }
  };

  const handleOpenProofModal = (payment: PaymentContribution) => {
    setSelectedPayment(payment);
    setProofModalVisible(true);
  };

  const handleProofSubmit = async (payload: ProofSubmitPayload) => {
    // In production this would call FirebaseProvider.submitProof
    Alert.alert(
      'Gönderildi',
      `₺${payload.amount} ${payload.method} ödemesi kaydedildi.${payload.proofUri ? '\nDekont yüklendi.' : payload.proofUrl ? '\nDekont linki eklendi.' : ''}`,
    );
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return colors.success;
      case 'partial': return colors.warning;
      case 'unpaid': return colors.error;
    }
  };

  const getStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return 'Ödendi';
      case 'partial': return 'Kısmi';
      case 'unpaid': return 'Ödenmemiş';
    }
  };

  const getStatusIcon = (status: PaymentStatus): string => {
    switch (status) {
      case 'paid': return 'check-circle';
      case 'partial': return 'clock-outline';
      case 'unpaid': return 'alert-circle';
    }
  };

  const getProofStatusColor = (status: ProofEntry['status']) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
    }
  };

  const getProofStatusLabel = (status: ProofEntry['status']) => {
    switch (status) {
      case 'approved': return 'Onaylı';
      case 'rejected': return 'Reddedildi';
      case 'pending': return 'Bekliyor';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ödemelerim</Text>
        <View style={styles.placeholder} />
      </View>

      <AppScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: colors.info }]}>
            <Text style={styles.summaryLabel}>Toplam</Text>
            <Text style={styles.summaryAmount}>₺{totalAmount}</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: colors.success }]}>
            <Text style={styles.summaryLabel}>Ödenen</Text>
            <Text style={[styles.summaryAmount, { color: colors.success }]}>₺{totalPaid}</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: colors.error }]}>
            <Text style={styles.summaryLabel}>Kalan</Text>
            <Text style={[styles.summaryAmount, { color: colors.error }]}>₺{totalRemaining}</Text>
          </View>
        </View>

        {/* IBAN Section */}
        <TouchableOpacity style={styles.ibanCard} onPress={handleCopyIban} activeOpacity={0.7}>
          <View style={styles.ibanLeft}>
            <Icon name="bank" size={20} color={colors.primary} />
            <View>
              <Text style={styles.ibanLabel}>Takım IBAN</Text>
              <Text style={styles.ibanText}>{MOCK_IBAN}</Text>
            </View>
          </View>
          <View style={styles.ibanCopyBtn}>
            <Icon name="content-copy" size={18} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment List */}
        {filteredPayments.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="cash-check" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Bu kategoride ödeme yok</Text>
          </View>
        ) : (
          filteredPayments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentTop}>
                <View style={styles.paymentTitleRow}>
                  <Icon
                    name={getStatusIcon(payment.status) as any}
                    size={20}
                    color={getStatusColor(payment.status)}
                  />
                  <Text style={styles.paymentLabel}>{payment.label}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(payment.status)}20` }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(payment.status) }]}>
                    {getStatusLabel(payment.status)}
                  </Text>
                </View>
              </View>

              {payment.description && (
                <Text style={styles.paymentDescription}>{payment.description}</Text>
              )}

              <View style={styles.paymentAmountRow}>
                <View>
                  <Text style={styles.paymentAmountLabel}>Tutar</Text>
                  <Text style={styles.paymentAmount}>₺{payment.amount}</Text>
                </View>
                <View>
                  <Text style={styles.paymentAmountLabel}>Ödenen</Text>
                  <Text style={[styles.paymentAmount, { color: colors.success }]}>₺{payment.paidAmount}</Text>
                </View>
                <View>
                  <Text style={styles.paymentAmountLabel}>Kalan</Text>
                  <Text style={[styles.paymentAmount, { color: payment.amount - payment.paidAmount > 0 ? colors.error : colors.success }]}>
                    ₺{payment.amount - payment.paidAmount}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.paymentProgressBg}>
                <View
                  style={[
                    styles.paymentProgressFill,
                    {
                      width: `${Math.min((payment.paidAmount / payment.amount) * 100, 100)}%`,
                      backgroundColor: getStatusColor(payment.status),
                    },
                  ]}
                />
              </View>

              {/* Proof History Section */}
              {payment.proofHistory && payment.proofHistory.length > 0 && (
                <>
                  <TouchableOpacity
                    style={styles.proofHistoryToggle}
                    onPress={() => setExpandedHistory(expandedHistory === payment.id ? null : payment.id)}
                    activeOpacity={0.7}
                  >
                    <Icon name="history" size={14} color={colors.info} />
                    <Text style={styles.proofHistoryToggleText}>
                      Dekont Geçmişi ({payment.proofHistory.length})
                    </Text>
                    <Icon
                      name={expandedHistory === payment.id ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.text.tertiary}
                    />
                  </TouchableOpacity>

                  {expandedHistory === payment.id && payment.proofHistory.map((proof) => (
                    <View key={proof.id} style={styles.proofHistoryItem}>
                      <View style={styles.proofHistoryLeft}>
                        <Icon
                          name={proof.type === 'image' ? 'image' : proof.type === 'pdf' ? 'file-pdf-box' : 'link'}
                          size={18}
                          color={colors.text.secondary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.proofHistoryMethod}>
                            {proof.method === 'eft' ? 'EFT/Havale' : proof.method === 'cash' ? 'Nakit' : 'Kart'} · ₺{proof.amount}
                          </Text>
                          <Text style={styles.proofHistoryDate}>
                            {new Date(proof.submittedAt).toLocaleDateString('tr-TR', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                            {proof.note ? ` · ${proof.note}` : ''}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.proofStatusBadge, { backgroundColor: `${getProofStatusColor(proof.status)}20` }]}>
                        <Text style={[styles.proofStatusText, { color: getProofStatusColor(proof.status) }]}>
                          {getProofStatusLabel(proof.status)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              )}

              <View style={styles.paymentBottom}>
                <Text style={styles.paymentDue}>
                  <Icon name="calendar-clock" size={12} color={colors.text.tertiary} /> Son: {payment.dueDate}
                </Text>
                {payment.status !== 'paid' && (
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => handleOpenProofModal(payment)}
                    activeOpacity={0.7}
                  >
                    <Icon name="send" size={16} color={colors.primary} />
                    <Text style={styles.uploadBtnText}>Ödeme Gönder</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </AppScrollView>

      {/* Payment Proof Modal */}
      <PaymentProofModal
        visible={proofModalVisible}
        onClose={() => { setProofModalVisible(false); setSelectedPayment(null); }}
        onSubmit={handleProofSubmit}
        expectedAmount={selectedPayment?.amount ?? 0}
        paidAmount={selectedPayment?.paidAmount ?? 0}
        reservationLabel={selectedPayment?.label}
        proofHistory={selectedPayment?.proofHistory}
      />
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
  scrollContent: { paddingBottom: 100 },
  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  summaryAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  // IBAN
  ibanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  ibanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  ibanLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.semiBold,
  },
  ibanText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  ibanCopyBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary}18`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.secondary,
  },
  // Payment card
  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  paymentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  paymentLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  paymentDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  paymentAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  paymentAmountLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  paymentAmount: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  paymentProgressBg: {
    height: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  paymentProgressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  // Proof history
  proofHistoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: `${colors.info}10`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.info}20`,
    marginBottom: spacing.sm,
  },
  proofHistoryToggleText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.info,
  },
  proofHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  proofHistoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  proofHistoryMethod: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  proofHistoryDate: {
    color: colors.text.tertiary,
    fontSize: 10,
    marginTop: 1,
  },
  proofStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  proofStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  paymentBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
  },
  paymentDue: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.primary}25`,
  },
  uploadBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
});
