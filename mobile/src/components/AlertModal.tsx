/**
 * Profesyonel Alert Modal – window.alert yerine uygulama stilinde modal
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';

export interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'info' | 'error' | 'warning' | 'success';
  confirmText?: string;
  onConfirm: () => void;
  secondaryText?: string;
  onSecondary?: () => void;
}

const typeConfig = {
  info: { icon: 'information' as const, color: colors.info, bg: `${colors.info}20` },
  error: { icon: 'alert-circle' as const, color: colors.error, bg: `${colors.error}20` },
  warning: { icon: 'alert' as const, color: colors.warning, bg: `${colors.warning}20` },
  success: { icon: 'check-circle' as const, color: colors.success, bg: `${colors.success}20` },
};

export default function AlertModal({
  visible,
  title,
  message,
  type = 'info',
  confirmText = 'Tamam',
  onConfirm,
  secondaryText,
  onSecondary,
}: AlertModalProps) {
  const cfg = typeConfig[type];
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onConfirm}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onConfirm}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e?.stopPropagation?.()}
          style={styles.card}
        >
          <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
            <Icon name={cfg.icon} size={40} color={cfg.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            {secondaryText && onSecondary ? (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { borderColor: cfg.color }]}
                onPress={onSecondary}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, { color: cfg.color }]}>{secondaryText}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: cfg.color }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    }),
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  buttonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary, // primary button text (overridden for secondary)
  },
});
