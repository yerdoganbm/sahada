/**
 * WhatsAppIntegrationScreen – WhatsApp bildirim ayarları (Firestore)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import AlertModal from '../components/AlertModal';

type WhatsAppNavProp = StackNavigationProp<RootStackParamList, 'WhatsAppIntegration'>;

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
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="whatsapp" size={32} color="#25D366" />
              <View style={styles.rowContent}>
                <Text style={styles.title}>WhatsApp Bildirimleri</Text>
                <Text style={styles.desc}>
                  Maç hatırlatmaları, ödeme bildirimleri ve takım güncellemelerini WhatsApp üzerinden alın.
                </Text>
              </View>
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{enabled ? 'Açık' : 'Kapalı'}</Text>
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
          </View>

          {!user?.phone && (
            <View style={styles.warnCard}>
              <Icon name="information" size={24} color={colors.warning} />
              <Text style={styles.warnText}>
                WhatsApp bildirimleri için profilinde kayıtlı bir telefon numarası olması gerekir.
              </Text>
            </View>
          )}
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, ...typography.h3, color: colors.text.primary, textAlign: 'center' },
  placeholder: { width: 40 },
  content: { padding: spacing.lg },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  rowContent: { flex: 1, marginLeft: spacing.md },
  title: { ...typography.h3, color: colors.text.primary },
  desc: { ...typography.caption, color: colors.text.secondary, marginTop: spacing.xs },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  switchLabel: { ...typography.body, color: colors.text.secondary },
  warnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}20`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  warnText: { ...typography.caption, color: colors.text.secondary, marginLeft: spacing.md, flex: 1 },
});
