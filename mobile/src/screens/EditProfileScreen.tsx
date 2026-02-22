/**
 * Edit Profile Screen – Profil düzenleme
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import AlertModal from '../components/AlertModal';
import type { PlayerPosition } from '../types';

type EditProfileNavProp = StackNavigationProp<RootStackParamList, 'EditProfile'>;

const POSITIONS: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

export default function EditProfileScreen() {
  const navigation = useNavigation<EditProfileNavProp>();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [position, setPosition] = useState<PlayerPosition>(user?.position ?? 'MID');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type?: 'info' | 'error' | 'success' } | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setAlert({ title: 'Hata', message: 'İsim gerekli.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await updateUser({ name: name.trim(), position });
      setAlert({ title: 'Kaydedildi', message: 'Profil güncellendi.', type: 'success' });
    } catch {
      setAlert({ title: 'Hata', message: 'Güncelleme yapılamadı.', type: 'error' });
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
        onConfirm={() => {
          setAlert(null);
          if (alert?.type === 'success') navigation.goBack();
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profili Düzenle</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.avatarSection}>
          <Image
            source={{ uri: user?.avatar || `https://i.pravatar.cc/150?u=${user?.id}` }}
            style={styles.avatar}
          />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>İsim</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Adınız"
            placeholderTextColor={colors.text.disabled}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Pozisyon</Text>
          <View style={styles.positionRow}>
            {POSITIONS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.positionChip, position === p && styles.positionChipActive]}
                onPress={() => setPosition(p)}
              >
                <Text style={[styles.positionChipText, position === p && styles.positionChipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  saveBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  form: { padding: spacing.lg },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.lg,
  },
  positionRow: { flexDirection: 'row', gap: spacing.sm },
  positionChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  positionChipActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  positionChipText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  positionChipTextActive: { color: colors.primary },
});
