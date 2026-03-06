/**
 * PaymentProofModal — Full dekont/receipt upload wizard for React Native.
 * 4-step flow: method → amount → proof (camera/gallery/link) → confirm.
 * Mirrors web components/PaymentProofModal.tsx design.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, TextInput,
  Pressable, Alert, ActivityIndicator, Image, Platform, Linking,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { launchCamera, launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker';
import { colors, spacing, borderRadius } from '../theme';
import type { ProofEntry } from '../types';

type MoneyMethod = 'cash' | 'eft' | 'card';
type Step = 'method' | 'amount' | 'proof' | 'confirm';

export interface ProofSubmitPayload {
  method: MoneyMethod | 'deposit' | 'partial';
  amount: number;
  proofUri?: string;
  proofUrl?: string;
  proofFileName?: string;
  note?: string;
  isPartial?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: ProofSubmitPayload) => Promise<void> | void;
  expectedAmount: number;
  paidAmount?: number;
  memberName?: string;
  reservationLabel?: string;
  captainMode?: boolean;
  /** Existing proof entries to show history */
  proofHistory?: ProofEntry[];
}

const METHODS = [
  { id: 'cash' as const, label: 'Nakit', sub: 'Kaptana elden teslim', icon: 'cash' as const, color: '#10B981', needsProof: false },
  { id: 'eft' as const, label: 'EFT / Havale', sub: 'Banka transferi — dekont gönder', icon: 'bank-transfer' as const, color: '#3B82F6', needsProof: true },
  { id: 'deposit' as const, label: 'Kapora', sub: 'Rezervasyon güvencesi', icon: 'lock' as const, color: '#F59E0B', needsProof: true },
  { id: 'card' as const, label: 'Kart (POS)', sub: 'Kredi / banka kartı', icon: 'credit-card' as const, color: '#8B5CF6', needsProof: true },
  { id: 'partial' as const, label: 'Kısmi Ödeme', sub: 'Bir kısmını öde, kalan borçta kalır', icon: 'chart-pie' as const, color: '#EC4899', needsProof: false },
];

export default function PaymentProofModal({
  visible, onClose, onSubmit, expectedAmount, paidAmount = 0,
  memberName, reservationLabel, captainMode = false, proofHistory,
}: Props) {
  const remaining = Math.max(0, expectedAmount - paidAmount);
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState(remaining > 0 ? String(remaining) : '');
  const [proofUri, setProofUri] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofFileName, setProofFileName] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const sel = METHODS.find(m => m.id === method);
  const parsedAmount = parseFloat(amount) || 0;
  const isPartial = parsedAmount > 0 && parsedAmount < remaining;

  const reset = () => {
    setStep('method'); setMethod(null);
    setAmount(remaining > 0 ? String(remaining) : '');
    setProofUri(''); setProofUrl(''); setProofFileName('');
    setNote(''); setSubmitting(false); setShowHistory(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handlePickGallery = useCallback(async () => {
    try {
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });
      if (result.assets?.[0]) {
        setProofUri(result.assets[0].uri ?? '');
        setProofFileName(result.assets[0].fileName ?? 'dekont.jpg');
        setProofUrl('');
      }
    } catch {
      Alert.alert('Hata', 'Galeri açılamadı.');
    }
  }, []);

  const handlePickCamera = useCallback(async () => {
    try {
      const result: ImagePickerResponse = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        saveToPhotos: false,
      });
      if (result.assets?.[0]) {
        setProofUri(result.assets[0].uri ?? '');
        setProofFileName(result.assets[0].fileName ?? 'dekont_kamera.jpg');
        setProofUrl('');
      }
    } catch {
      Alert.alert('Hata', 'Kamera açılamadı.');
    }
  }, []);

  const handleSubmit = async () => {
    if (!method || parsedAmount <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        method: method as any,
        amount: parsedAmount,
        proofUri: proofUri || undefined,
        proofUrl: proofUrl || undefined,
        proofFileName: proofFileName || undefined,
        note: note || undefined,
        isPartial,
      });
      reset(); onClose();
    } catch {
      Alert.alert('Hata', 'Gönderilirken bir sorun oluştu.');
    } finally { setSubmitting(false); }
  };

  if (!visible) return null;
  const c = sel?.color ?? '#10B981';
  const steps: Step[] = ['method', 'amount', 'proof', 'confirm'];
  const currentIdx = steps.indexOf(step);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Progress bar */}
          <View style={styles.progressRow}>
            {steps.map((s, i) => (
              <View key={s} style={[styles.progressBar, { backgroundColor: i <= currentIdx ? c : 'rgba(255,255,255,0.1)' }]} />
            ))}
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>{captainMode ? 'Ödeme Kaydet' : 'Ödeme Gönder'}</Text>
              <Text style={styles.subtitle}>
                {memberName ? `${memberName} · ` : ''}{reservationLabel ?? 'Rezervasyon ödemesi'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Icon name="close" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          {/* Summary bar */}
          <View style={styles.summaryBar}>
            <View>
              <Text style={styles.summaryLabel}>TOPLAM</Text>
              <Text style={styles.summaryValue}>₺{expectedAmount.toLocaleString('tr-TR')}</Text>
            </View>
            {paidAmount > 0 && (
              <View style={{ alignItems: 'flex-end' as const }}>
                <Text style={styles.summaryLabel}>ÖDENEN</Text>
                <Text style={[styles.summaryValue, { color: '#10B981' }]}>₺{paidAmount.toLocaleString('tr-TR')}</Text>
              </View>
            )}
            {remaining > 0 && (
              <View style={{ alignItems: 'flex-end' as const }}>
                <Text style={styles.summaryLabel}>KALAN</Text>
                <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>₺{remaining.toLocaleString('tr-TR')}</Text>
              </View>
            )}
          </View>

          {/* Proof history toggle */}
          {proofHistory && proofHistory.length > 0 && step === 'method' && (
            <TouchableOpacity style={styles.historyToggle} onPress={() => setShowHistory(!showHistory)}>
              <Icon name="history" size={14} color={colors.info} />
              <Text style={styles.historyToggleText}>
                {showHistory ? 'Geçmişi Gizle' : `Dekont Geçmişi (${proofHistory.length})`}
              </Text>
              <Icon name={showHistory ? 'chevron-up' : 'chevron-down'} size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}

          {/* Proof history list */}
          {showHistory && proofHistory && proofHistory.map(p => (
            <View key={p.id} style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <Icon name={p.type === 'image' ? 'image' : p.type === 'pdf' ? 'file-pdf-box' : 'link'} size={18} color={colors.text.secondary} />
                <View>
                  <Text style={styles.historyMethod}>
                    {p.method === 'eft' ? 'EFT' : p.method === 'cash' ? 'Nakit' : 'Kart'} · ₺{p.amount}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(p.submittedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              <View style={[styles.historyBadge, {
                backgroundColor: p.status === 'approved' ? '#10B98120' : p.status === 'rejected' ? '#EF444420' : '#F59E0B20',
              }]}>
                <Text style={[styles.historyBadgeText, {
                  color: p.status === 'approved' ? '#10B981' : p.status === 'rejected' ? '#EF4444' : '#F59E0B',
                }]}>
                  {p.status === 'approved' ? 'Onaylı' : p.status === 'rejected' ? 'Red' : 'Bekliyor'}
                </Text>
              </View>
            </View>
          ))}

          {/* STEP 1: METHOD */}
          {step === 'method' && !showHistory && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>Ödeme yöntemini seç</Text>
              {METHODS.map(m => (
                <TouchableOpacity key={m.id} style={styles.methodCard} activeOpacity={0.7}
                  onPress={() => { setMethod(m.id); setStep('amount'); }}>
                  <View style={[styles.methodIcon, { backgroundColor: `${m.color}18` }]}>
                    <Icon name={m.icon} size={22} color={m.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodLabel}>{m.label}</Text>
                    <Text style={styles.methodSub}>{m.sub}</Text>
                  </View>
                  {m.needsProof && (
                    <View style={styles.dekontBadge}>
                      <Text style={styles.dekontBadgeText}>DEKONT</Text>
                    </View>
                  )}
                  <Icon name="chevron-right" size={18} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* STEP 2: AMOUNT */}
          {step === 'amount' && sel && (
            <View style={styles.stepContainer}>
              <View style={[styles.selectedMethod, { backgroundColor: `${sel.color}12`, borderColor: `${sel.color}30` }]}>
                <Icon name={sel.icon} size={20} color={sel.color} />
                <Text style={[styles.selectedMethodText, { color: sel.color }]}>{sel.label}</Text>
              </View>

              <Text style={styles.stepLabel}>Miktar (₺)</Text>
              <TextInput
                style={[styles.amountInput, { borderColor: parsedAmount > 0 ? c : 'rgba(255,255,255,0.1)' }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder={String(remaining)}
                placeholderTextColor="#475569"
                autoFocus
              />

              {/* Quick amounts */}
              <View style={styles.quickAmountRow}>
                {[...new Set([remaining, Math.round(remaining / 2), 100, 200].filter(v => v > 0 && v <= remaining).map(v => Math.round(v)))].slice(0, 4).map(v => (
                  <TouchableOpacity key={v} style={[styles.quickAmountBtn, {
                    backgroundColor: parsedAmount === v ? c : 'rgba(255,255,255,0.05)',
                    borderColor: parsedAmount === v ? c : 'rgba(255,255,255,0.08)',
                  }]} onPress={() => setAmount(String(v))}>
                    <Text style={[styles.quickAmountText, { color: parsedAmount === v ? '#0d1117' : 'rgba(255,255,255,0.4)' }]}>₺{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {isPartial && (
                <Text style={styles.partialWarning}>⚠ Kısmi ödeme: ₺{(remaining - parsedAmount).toFixed(0)} borçlu kalacak</Text>
              )}

              <Text style={styles.stepLabel}>Not (opsiyonel)</Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Ödeme notu..."
                placeholderTextColor="#475569"
              />

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep('method')}>
                  <Text style={styles.backBtnText}>← Geri</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextBtn, { backgroundColor: parsedAmount > 0 ? c : 'rgba(255,255,255,0.06)' }]}
                  onPress={() => setStep(sel.needsProof ? 'proof' : 'confirm')}
                  disabled={parsedAmount <= 0}>
                  <Text style={[styles.nextBtnText, { color: parsedAmount > 0 ? '#0d1117' : 'rgba(255,255,255,0.2)' }]}>Devam →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: PROOF */}
          {step === 'proof' && sel && (
            <View style={styles.stepContainer}>
              <Text style={styles.proofTitle}>Dekont / Kanıt</Text>
              <Text style={styles.proofSub}>Fotoğraf çek, galeriden seç veya link gir — opsiyonel</Text>

              {/* Camera & Gallery buttons */}
              <View style={styles.pickerRow}>
                <TouchableOpacity style={styles.pickerBtn} onPress={handlePickCamera} activeOpacity={0.7}>
                  <Icon name="camera" size={28} color={c} />
                  <Text style={[styles.pickerBtnText, { color: c }]}>Kamera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickerBtn} onPress={handlePickGallery} activeOpacity={0.7}>
                  <Icon name="image-multiple" size={28} color={c} />
                  <Text style={[styles.pickerBtnText, { color: c }]}>Galeri</Text>
                </TouchableOpacity>
              </View>

              {/* Preview */}
              {proofUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: proofUri }} style={styles.previewImage} resizeMode="cover" />
                  <View style={styles.previewInfo}>
                    <Icon name="check-circle" size={16} color="#10B981" />
                    <Text style={styles.previewName} numberOfLines={1}>{proofFileName}</Text>
                    <TouchableOpacity onPress={() => { setProofUri(''); setProofFileName(''); }}>
                      <Icon name="close-circle" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.divider} />
              </View>

              {/* Link input */}
              <Text style={styles.stepLabel}>Dekont linki</Text>
              <TextInput
                style={[styles.noteInput, { borderColor: proofUrl ? c : 'rgba(255,255,255,0.1)' }]}
                value={proofUrl}
                onChangeText={t => { setProofUrl(t); if (t) { setProofUri(''); setProofFileName(''); } }}
                placeholder="https://..."
                placeholderTextColor="#475569"
                autoCapitalize="none"
              />

              <Text style={styles.proofHint}>Dekont yoksa atla — sonra ödeme geçmişinden eklenebilir</Text>

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep('amount')}>
                  <Text style={styles.backBtnText}>← Geri</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextBtn, { backgroundColor: c }]}
                  onPress={() => setStep('confirm')}>
                  <Text style={[styles.nextBtnText, { color: '#0d1117' }]}>
                    {proofUri || proofUrl ? 'Dekontu Ekle →' : 'Dekontsuz →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: CONFIRM */}
          {step === 'confirm' && sel && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>Özet — Onayla</Text>

              <View style={[styles.confirmCard, { borderColor: `${sel.color}30` }]}>
                <View style={styles.confirmHeader}>
                  <View style={[styles.methodIcon, { backgroundColor: `${sel.color}18` }]}>
                    <Icon name={sel.icon} size={20} color={sel.color} />
                  </View>
                  <View>
                    <Text style={styles.confirmMethodText}>{sel.label}</Text>
                    {memberName && <Text style={styles.confirmMemberText}>{memberName}</Text>}
                  </View>
                </View>

                <View style={styles.confirmRows}>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmRowLabel}>Tutar</Text>
                    <Text style={[styles.confirmRowValue, { color: sel.color, fontSize: 18 }]}>₺{parsedAmount.toLocaleString('tr-TR')}</Text>
                  </View>
                  {isPartial && (
                    <View style={styles.confirmRow}>
                      <Text style={styles.confirmRowLabel}>Kalan borç</Text>
                      <Text style={[styles.confirmRowValue, { color: '#F59E0B' }]}>₺{(remaining - parsedAmount).toFixed(0)}</Text>
                    </View>
                  )}
                  {(proofUri || proofUrl) && (
                    <View style={styles.confirmRow}>
                      <Text style={styles.confirmRowLabel}>Dekont</Text>
                      <Text style={[styles.confirmRowValue, { color: '#10B981' }]}>
                        {proofUri ? `📎 ${proofFileName}` : '🔗 Link'}
                      </Text>
                    </View>
                  )}
                  {note ? (
                    <View style={styles.confirmRow}>
                      <Text style={styles.confirmRowLabel}>Not</Text>
                      <Text style={styles.confirmRowValue} numberOfLines={2}>{note}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {captainMode && (
                <View style={styles.captainWarning}>
                  <Text style={styles.captainWarningText}>⚠ Kaptan adına kayıt. İşlem geri alınamaz.</Text>
                </View>
              )}

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(sel.needsProof ? 'proof' : 'amount')} disabled={submitting}>
                  <Text style={styles.backBtnText}>← Geri</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextBtn, { backgroundColor: submitting ? 'rgba(255,255,255,0.06)' : sel.color }]}
                  onPress={handleSubmit}
                  disabled={submitting}>
                  {submitting ? (
                    <ActivityIndicator color="#0d1117" size="small" />
                  ) : (
                    <Text style={[styles.nextBtnText, { color: '#0d1117' }]}>Onayla & Gönder ✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0d1117',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderBottomWidth: 0,
    maxHeight: '92%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row', gap: 6, marginBottom: 12,
  },
  progressBar: {
    flex: 1, height: 3, borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: 11, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  summaryBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12,
  },
  summaryLabel: { color: '#64748b', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  summaryValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },
  // History
  historyToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)',
    marginBottom: 8,
  },
  historyToggleText: { flex: 1, color: colors.info, fontSize: 12, fontWeight: '700' },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  historyMethod: { color: '#fff', fontSize: 12, fontWeight: '700' },
  historyDate: { color: '#64748b', fontSize: 10, marginTop: 1 },
  historyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  historyBadgeText: { fontSize: 9, fontWeight: '800' },
  // Steps
  stepContainer: { marginTop: 4 },
  stepLabel: { color: '#64748b', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  // Method
  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  methodIcon: {
    width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  methodLabel: { color: '#fff', fontSize: 14, fontWeight: '800' },
  methodSub: { color: '#64748b', fontSize: 10, marginTop: 2 },
  dekontBadge: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  dekontBadgeText: { color: '#60A5FA', fontSize: 8, fontWeight: '800' },
  // Amount
  selectedMethod: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, marginBottom: 8,
  },
  selectedMethodText: { fontSize: 14, fontWeight: '800' },
  amountInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, borderWidth: 1.5,
    color: '#fff', fontSize: 22, fontWeight: '800',
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8,
  },
  quickAmountRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  quickAmountBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center',
  },
  quickAmountText: { fontSize: 12, fontWeight: '800' },
  partialWarning: { color: '#F59E0B', fontSize: 11, marginBottom: 8 },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  // Proof
  proofTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  proofSub: { color: '#64748b', fontSize: 11, marginBottom: 12 },
  pickerRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  pickerBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 20, gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
  },
  pickerBtnText: { fontSize: 13, fontWeight: '700' },
  previewContainer: {
    borderRadius: 14, overflow: 'hidden', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
  },
  previewImage: { width: '100%', height: 140 },
  previewInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  previewName: { flex: 1, color: '#10B981', fontSize: 12, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { color: '#334155', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  proofHint: { color: '#334155', fontSize: 10, textAlign: 'center', marginBottom: 12 },
  // Confirm
  confirmCard: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  confirmHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  confirmMethodText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  confirmMemberText: { color: '#64748b', fontSize: 11 },
  confirmRows: { padding: 16 },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  confirmRowLabel: { color: '#64748b', fontSize: 12 },
  confirmRowValue: { color: '#94a3b8', fontSize: 13, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
  captainWarning: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 8,
  },
  captainWarningText: { color: '#F59E0B', fontSize: 11, fontWeight: '700' },
  // Navigation
  navRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  backBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  backBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '800' },
  nextBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  nextBtnText: { fontSize: 14, fontWeight: '800' },
});
