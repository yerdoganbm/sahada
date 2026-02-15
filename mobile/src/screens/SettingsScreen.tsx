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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bildirimler</Text>
        <View style={styles.card}>
          <Row
            icon="soccer"
            label="Maç bildirimleri"
            desc="Maçtan 2 saat önce hatırlat"
            value={notifications.matches}
            onToggle={() => toggleNotification('matches')}
          />
          <Row
            icon="account-group"
            label="Kadro bildirimleri"
            desc="Kadro açıklandığında bildir"
            value={notifications.squad}
            onToggle={() => toggleNotification('squad')}
          />
          <Row
            icon="cash"
            label="Ödeme bildirimleri"
            desc="Ödeme hatırlatmaları"
            value={notifications.payments}
            onToggle={() => toggleNotification('payments')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Görünüm</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              Alert.alert(
                'Tema',
                'Açık ve koyu tema seçeneği yakında eklenecek.',
                [{ text: 'Tamam' }]
              )
            }
          >
            <View style={styles.rowIcon}>
              <Icon name="theme-light-dark" size={22} color={colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Tema</Text>
              <Text style={styles.rowDesc}>Koyu / Açık mod</Text>
            </View>
            <Icon name="chevron-right" size={22} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hesap</Text>
        <View style={styles.card}>
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
              <Text style={styles.rowLabel}>Çıkış Yap</Text>
              <Text style={styles.rowDesc}>Hesabından güvenli çıkış</Text>
            </View>
            <Icon name="chevron-right" size={22} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footer}>Sahada v1.0 • Ayarlar</Text>
    </ScrollView>
  );
}

function Row({
  icon,
  label,
  desc,
  value,
  onToggle,
}: {
  icon: string;
  label: string;
  desc: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surface, true: colors.primary }}
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
  footer: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
    textAlign: 'center',
    marginVertical: spacing.xxl,
  },
});
