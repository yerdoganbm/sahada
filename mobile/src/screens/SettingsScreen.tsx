/**
 * Settings Screen - Bildirim tercihleri (AsyncStorage) ve çıkış
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types';
import { spacing, borderRadius, typography, colorsDark, colors } from '../theme';
import { hapticLight } from '../utils/haptic';

const NOTIF_STORAGE_KEY = '@sahada_notif_prefs';

const DEFAULT_NOTIF = {
  matches: true,
  squad: true,
  payments: true,
};

type SettingsNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { logout } = useAuth();
  const { mode, colors, setMode } = useTheme();
  const [notifications, setNotifications] = useState(DEFAULT_NOTIF);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(NOTIF_STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        try {
          if (raw) {
            const parsed = JSON.parse(raw);
            setNotifications((prev) => ({ ...DEFAULT_NOTIF, ...parsed }));
          }
        } catch (_) {}
      });
    return () => { cancelled = true; };
  }, []);

  const toggleNotification = useCallback((key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.goBack()}
          >
          <Icon name="arrow-left" size={24} color={colors?.text?.primary ?? '#FFF'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Ayarlar</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Bildirimler</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border?.light }]}>
          <Row
            colors={colors}
            icon="soccer"
            label="Maç bildirimleri"
            desc="Maçtan 2 saat önce hatırlat"
            value={notifications.matches}
            onToggle={() => toggleNotification('matches')}
          />
          <Row
            colors={colors}
            icon="account-group"
            label="Kadro bildirimleri"
            desc="Kadro açıklandığında bildir"
            value={notifications.squad}
            onToggle={() => toggleNotification('squad')}
          />
          <Row
            colors={colors}
            icon="cash"
            label="Ödeme bildirimleri"
            desc="Ödeme hatırlatmaları"
            value={notifications.payments}
            onToggle={() => toggleNotification('payments')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Görünüm</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border?.light }]}>
          <View style={[styles.row, { borderBottomColor: colors.border?.light }]}>
            <View style={styles.rowIcon}>
              <Icon name="theme-light-dark" size={22} color={colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text.primary }]}>Tema</Text>
              <Text style={[styles.rowDesc, { color: colors.text.secondary }]}>
                {mode === 'dark' ? 'Koyu mod' : 'Açık mod'}
              </Text>
            </View>
            <View style={styles.themeToggle}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  mode === 'dark' && styles.themeOptionActive,
                  { backgroundColor: mode === 'dark' ? colors.primary : colors.background.tertiary },
                ]}
                onPress={() => setMode('dark')}
              >
                <Icon name="weather-night" size={18} color={mode === 'dark' ? '#FFF' : colors.text.secondary} />
                <Text style={[styles.themeOptionText, { color: mode === 'dark' ? '#FFF' : colors.text.secondary }]}>Koyu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  mode === 'light' && styles.themeOptionActive,
                  { backgroundColor: mode === 'light' ? colors.primary : colors.background.tertiary },
                ]}
                onPress={() => setMode('light')}
              >
                <Icon name="weather-sunny" size={18} color={mode === 'light' ? '#FFF' : colors.text.secondary} />
                <Text style={[styles.themeOptionText, { color: mode === 'light' ? '#FFF' : colors.text.secondary }]}>Açık</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Hesap</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border?.light }]}>
          <TouchableOpacity
            style={[styles.row, styles.dangerRow]}
            onPress={() => {
              hapticLight();
              handleLogout();
            }}
            accessibilityLabel="Çıkış yap"
            accessibilityRole="button"
          >
            <View style={styles.rowIconDanger}>
              <Icon name="logout" size={22} color={colors.error} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text.primary }]}>Çıkış Yap</Text>
              <Text style={[styles.rowDesc, { color: colors.text.secondary }]}>Hesabından güvenli çıkış</Text>
            </View>
            <Icon name="chevron-right" size={22} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.footer, { color: colors.text.disabled }]}>Sahada v1.0 • Ayarlar</Text>
    </ScrollView>
  );
}

function Row({
  colors: c,
  icon,
  label,
  desc,
  value,
  onToggle,
}: {
  colors: typeof colorsDark;
  icon: string;
  label: string;
  desc: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: c.border?.light }]}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={22} color={c.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: c.text.primary }]}>{label}</Text>
        <Text style={[styles.rowDesc, { color: c.text.secondary }]}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: c.background.tertiary, true: c.primary }}
        thumbColor="#FFF"
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rowIconDanger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  rowDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  dangerRow: {
    borderBottomWidth: 0,
  },
  themeToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  themeOptionActive: {},
  themeOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  footer: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
    textAlign: 'center',
    marginVertical: spacing.xxl,
  },
});
