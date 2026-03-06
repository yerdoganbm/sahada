/**
 * PaymentProofModal — React Native payment proof upload modal
 * Mirrors web components/PaymentProofModal.tsx
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';

interface PaymentProofModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { proofUrl: string; note?: string }) => void;
  memberName?: string;
  expectedAmount?: number;
  paidAmount?: number;
}

export default function PaymentProofModal({ visible, onClose, onSubmit, memberName, expectedAmount = 0, paidAmount = 0 }: PaymentProofModalProps) {
  const [note, setNote] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  const remaining = expectedAmount - paidAmount;

  const handleSubmit = () => {
    if (!proofUrl.trim()) {
      Alert.alert('Uyarı', 'Lütfen dekont URL veya açıklama girin.');
      return;
    }
    onSubmit({ proofUrl: proofUrl.trim(), note: note.trim() || undefined });
    setProofUrl('');
    setNote('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.title}>Ödeme Kanıtı Gönder</Text>
          {memberName && <Text style={styles.subtitle}>{memberName}</Text>}

          {/* Amount info */}
          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Beklenen</Text>
              <Text style={styles.amountValue}>{expectedAmount}₺</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Ödenen</Text>
              <Text style={[styles.amountValue, { color: colors.primary }]}>{paidAmount}₺</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Kalan</Text>
              <Text style={[styles.amountValue, { color: remaining > 0 ? '#ef4444' : colors.primary }]}>{remaining}₺</Text>
            </View>
          </View>

          {/* Proof URL */}
          <Text style={styles.inputLabel}>Dekont Linki / Fotoğraf URL</Text>
          <TextInput
            style={styles.input}
            value={proofUrl}
            onChangeText={setProofUrl}
            placeholder="https://... veya dekont açıklaması"
            placeholderTextColor="#64748b"
          />

          {/* Note */}
          <Text style={styles.inputLabel}>Not (Opsiyonel)</Text>
          <TextInput
            style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
            value={note}
            onChangeText={setNote}
            placeholder="Ek açıklama..."
            placeholderTextColor="#64748b"
            multiline
          />

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.8}>
              <Text style={styles.cancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn} activeOpacity={0.8}>
              <Icon name="send" size={16} color="#fff" />
              <Text style={styles.submitText}>Gönder</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
  amountRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  amountItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  amountLabel: { fontSize: 10, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  amountValue: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 4 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  submitBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  submitText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
