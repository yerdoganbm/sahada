/**
 * CreateProfileScreen – Yeni oyuncu/profil ekleme (Firestore)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { addManualPlayer } from '../services/players';
import { hapticLight } from '../utils/haptic';
import AlertModal from '../components/AlertModal';
import type { PlayerPosition } from '../types';

type CreateProfileNavProp = StackNavigationProp<RootStackParamList, 'CreateProfile'>;

const POSITIONS: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

export default function CreateProfileScreen() {
  const navigation = useNavigation<CreateProfileNavProp>();
  const { user } = useAuth();
  const teamId = user?.teamId;
  const [name, setName] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('MID');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'error' | 'success';
  } | null>(null);

  const handleSave = async () => {
    hapticLight();
    const nameTrim = name.trim();
    if (!nameTrim) {
      setAlert({ title: 'Hata', message: 'İsim gerekli.', type: 'error' });
      return;
    }
    if (!teamId) {
      setAlert({ title: 'Hata', message: 'Takıma katılmadan profil eklenemez.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await addManualPlayer(teamId, { name: nameTrim, position });
      setAlert({
        title: 'Başarılı',
        message: `${nameTrim} kadroya eklendi.`,
        type: 'success',
      });
    } catch (err) {
      console.error('Add player error:', err);
      setAlert({
        title: 'Hata',
        message: (err as Error).message ?? 'Profil eklenemedi.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!teamId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil Oluştur</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={[styles.centered, styles.flex1]}>
          <Icon name="account-off-outline" size={64} color={colors.text.disabled} />
          <Text style={styles.emptyText}>Takıma katılmadan profil eklenemez</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <AlertModal
        visible={!!alert}
        title={alert?.title ?? ''}
        message={alert?.message ?? ''}
        type={alert?.type ?? 'info'}
        onConfirm={() => {
          setAlert(null);
          if (alert?.type === 'success') navigation.goBack();
        }}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yeni Profil</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Ekle'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>İsim</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Oyuncu adı"
            placeholderTextColor={colors.text.disabled}
          />
          <Text style={styles.label}>Pozisyon</Text>
          <View style={styles.positionRow}>
            {POSITIONS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, position === p && styles.chipActive]}
                onPress={() => setPosition(p)}
              >
                <Text style={[styles.chipText, position === p && styles.chipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  flex1: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.text.secondary, marginTop: spacing.md },
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
  saveBtn: { padding: spacing.sm },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.button, color: colors.primary },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 100 },
  label: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },
  positionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.body, color: colors.text.secondary },
  chipTextActive: { color: '#fff' },
});
