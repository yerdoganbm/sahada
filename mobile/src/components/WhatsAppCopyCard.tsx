/**
 * WhatsAppCopyCard — React Native WhatsApp message copy card
 * Mirrors web components/WhatsAppCopyCard.tsx
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Clipboard } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

interface WhatsAppCopyCardProps {
  message: string;
  recipientPhone?: string;
  label?: string;
}

export default function WhatsAppCopyCard({ message, recipientPhone, label = 'WhatsApp Mesajı' }: WhatsAppCopyCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const phone = recipientPhone?.replace(/\D/g, '') || '';
    const url = `whatsapp://send?${phone ? `phone=${phone}&` : ''}text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`).catch(() => {});
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon name="whatsapp" size={18} color="#25D366" />
        <Text style={styles.label}>{label}</Text>
      </View>

      <Text style={styles.preview} numberOfLines={3}>{message}</Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleCopy} activeOpacity={0.8} style={[styles.btn, copied && styles.btnCopied]}>
          <Icon name={copied ? 'check' : 'content-copy'} size={16} color={copied ? colors.primary : '#94a3b8'} />
          <Text style={[styles.btnText, copied && { color: colors.primary }]}>{copied ? 'Kopyalandı!' : 'Kopyala'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleWhatsApp} activeOpacity={0.8} style={styles.waBtn}>
          <Icon name="whatsapp" size={16} color="#fff" />
          <Text style={styles.waBtnText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  preview: { fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 18, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  btnCopied: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)' },
  btnText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  waBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#25D366' },
  waBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
