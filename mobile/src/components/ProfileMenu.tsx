/**
 * ProfileMenu — React Native floating profile & logout menu
 * Mirrors web components/ProfileMenu.tsx
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';

interface Player {
  id: string;
  name: string;
  avatar: string;
  role: string;
  isCaptain?: boolean;
  tier?: string;
}

interface ProfileMenuProps {
  user: Player;
  onLogout: () => void;
  onNavigate?: (screen: string) => void;
  accentColor?: string;
}

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  captain: 'Kaptan',
  member: 'Oyuncu',
  venue_owner: 'Saha Sahibi',
};

const MENU_ITEMS = [
  { key: 'profile', icon: 'account', label: 'Profilim' },
  { key: 'settings', icon: 'cog', label: 'Ayarlar' },
  { key: 'editProfile', icon: 'account-edit', label: 'Profil Düzenle' },
  { key: 'subscription', icon: 'star', label: 'Abonelik' },
];

export default function ProfileMenu({ user, onLogout, onNavigate, accentColor = '#10B981' }: ProfileMenuProps) {
  const [visible, setVisible] = useState(false);
  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.8} style={[styles.trigger, { borderColor: accentColor + '40' }]}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={[styles.avatar, { borderColor: accentColor + '40' }]} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: accentColor + '25', borderColor: accentColor + '40' }]}>
            <Text style={[styles.initials, { color: accentColor }]}>{initials}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.menu}>
            {/* User info */}
            <View style={styles.userInfo}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.menuAvatar} />
              ) : (
                <View style={[styles.menuAvatarFallback, { backgroundColor: accentColor + '25' }]}>
                  <Text style={{ color: accentColor, fontWeight: '800', fontSize: 16 }}>{initials}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userRole}>{roleLabel[user.role] || user.role}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Menu items */}
            {MENU_ITEMS.map(item => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => { setVisible(false); onNavigate?.(item.key); }}
              >
                <Icon name={item.icon as any} size={20} color="#94a3b8" />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.divider} />

            {/* Logout */}
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { setVisible(false); onLogout(); }}>
              <Icon name="logout" size={20} color="#ef4444" />
              <Text style={[styles.menuLabel, { color: '#ef4444' }]}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { borderWidth: 1.5, borderRadius: 12, padding: 2 },
  avatar: { width: 32, height: 32, borderRadius: 10, borderWidth: 1.5 },
  avatarFallback: { width: 32, height: 32, borderRadius: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  initials: { fontSize: 13, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  menu: { backgroundColor: '#1e293b', borderRadius: 20, width: '100%', maxWidth: 320, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  menuAvatar: { width: 44, height: 44, borderRadius: 14 },
  menuAvatarFallback: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  userRole: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuLabel: { fontSize: 14, fontWeight: '500', color: '#e2e8f0' },
});
