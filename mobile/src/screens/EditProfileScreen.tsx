/**
 * Edit Profile Screen – Profil düzenleme + fotoğraf güncelleme
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import AppScrollView from '../components/AppScrollView';
import AlertModal from '../components/AlertModal';
import type { PlayerPosition } from '../types';

type EditProfileNavProp = StackNavigationProp<RootStackParamList, 'EditProfile'>;

const POSITIONS: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];
const POS_LABELS: Record<string, string> = { GK: 'Kaleci', DEF: 'Defans', MID: 'Orta Saha', FWD: 'Forvet' };
const POS_COLORS: Record<string, string> = { GK: '#F59E0B', DEF: '#3B82F6', MID: '#10B981', FWD: '#EF4444' };

async function uploadAvatarToStorage(userId: string, localUri: string): Promise<string> {
  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `avatars/${userId}_${Date.now()}.${ext}`;
  const ref = storage().ref(filename);
  await ref.putFile(localUri);
  return ref.getDownloadURL();
}

export default function EditProfileScreen() {
  const navigation = useNavigation<EditProfileNavProp>();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [position, setPosition] = useState<PlayerPosition>(user?.position ?? 'MID');
  const [shirtNumber, setShirtNumber] = useState(user?.shirtNumber?.toString() ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [avatarLocal, setAvatarLocal] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type?: 'info' | 'error' | 'success' } | null>(null);

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      const result =
        source === 'camera'
          ? await launchCamera({ mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800 })
          : await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800 });

      if (result.didCancel || result.errorCode || !result.assets?.[0]?.uri) return;
      const uri = result.assets[0].uri!;
      setAvatarLocal(uri);

      if (!user?.id) return;
      setUploadingPhoto(true);
      try {
        const downloadUrl = await uploadAvatarToStorage(user.id, uri);
        setAvatar(downloadUrl);
        await updateUser({ avatar: downloadUrl });
      } catch (e) {
        Alert.alert('Yükleme Hatası', 'Fotoğraf yüklenemedi. İnternet bağlantınızı kontrol edin.');
        setAvatarLocal(null);
      } finally {
        setUploadingPhoto(false);
      }
    } catch (e) {
      console.warn('pickImage error', e);
    }
  };

  const showPhotoOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['İptal', 'Kamera', 'Galeri'],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) pickImage('camera');
          if (idx === 2) pickImage('gallery');
        }
      );
    } else {
      Alert.alert('Profil Fotoğrafı', 'Kaynak seçin', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Kamera', onPress: () => pickImage('camera') },
        { text: 'Galeri', onPress: () => pickImage('gallery') },
      ]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setAlert({ title: 'Hata', message: 'İsim gerekli.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await updateUser({
        name: name.trim(),
        position,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        shirtNumber: shirtNumber ? parseInt(shirtNumber, 10) : undefined,
        avatar: avatar || undefined,
      });
      setAlert({ title: 'Kaydedildi', message: 'Profilin güncellendi.', type: 'success' });
    } catch {
      setAlert({ title: 'Hata', message: 'Güncelleme yapılamadı.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = avatarLocal || avatar || `https://i.pravatar.cc/150?u=${user?.id}`;

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
      <AppScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profili Düzenle</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || uploadingPhoto}
            style={[styles.saveBtn, (saving || uploadingPhoto) && styles.saveBtnDisabled]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Kaydet</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrap} onPress={showPhotoOptions} disabled={uploadingPhoto}>
            <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            <View style={styles.avatarOverlay}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="camera" size={20} color="#fff" />
                  <Text style={styles.avatarOverlayText}>Değiştir</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Dokunarak fotoğrafını değiştir</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>KİŞİSEL BİLGİLER</Text>

            <Text style={styles.label}>Ad Soyad *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Adın Soyadın"
              placeholderTextColor={colors.text.disabled}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Telefon</Text>
            <View style={styles.inputRow}>
              <View style={styles.prefixBox}>
                <Text style={styles.prefixText}>+90</Text>
              </View>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={phone}
                onChangeText={setPhone}
                placeholder="5XX XXX XX XX"
                placeholderTextColor={colors.text.disabled}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={colors.text.disabled}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FUTBOL BİLGİLERİ</Text>

            <Text style={styles.label}>Pozisyon</Text>
            <View style={styles.positionGrid}>
              {POSITIONS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.positionCard,
                    position === p && { borderColor: POS_COLORS[p], backgroundColor: `${POS_COLORS[p]}15` },
                  ]}
                  onPress={() => setPosition(p)}
                >
                  <Text style={[styles.positionCode, position === p && { color: POS_COLORS[p] }]}>{p}</Text>
                  <Text style={[styles.positionLabel, position === p && { color: POS_COLORS[p] }]}>
                    {POS_LABELS[p]}
                  </Text>
                  {position === p && (
                    <View style={[styles.positionCheck, { backgroundColor: POS_COLORS[p] }]}>
                      <Icon name="check" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Forma Numarası</Text>
            <TextInput
              style={[styles.input, { width: 120 }]}
              value={shirtNumber}
              onChangeText={(t) => setShirtNumber(t.replace(/\D/g, '').slice(0, 2))}
              placeholder="10"
              placeholderTextColor={colors.text.disabled}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
        </View>
      </AppScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scrollContent: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, minWidth: 70, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: typography.fontSize.sm, fontWeight: '700', color: '#fff' },
  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl },
  avatarWrap: { position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: colors.primary },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 40,
    borderBottomLeftRadius: 55,
    borderBottomRightRadius: 55,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  avatarOverlayText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  avatarHint: { marginTop: spacing.sm, fontSize: typography.fontSize.xs, color: colors.text.tertiary },
  // Form
  form: { paddingHorizontal: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: colors.text.tertiary, letterSpacing: 1.5, marginBottom: spacing.md },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text.secondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.md,
  },
  inputFlex: { flex: 1, marginBottom: 0 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  prefixBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    height: 52,
    justifyContent: 'center',
  },
  prefixText: { fontSize: typography.fontSize.md, color: colors.text.secondary, fontWeight: '600' },
  // Position
  positionGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  positionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border.light,
    position: 'relative',
    paddingVertical: spacing.md,
  },
  positionCode: { fontSize: typography.fontSize.md, fontWeight: '800', color: colors.text.secondary },
  positionLabel: { fontSize: 9, fontWeight: '600', color: colors.text.tertiary, marginTop: 2 },
  positionCheck: { position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
});
