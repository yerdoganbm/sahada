/**
 * Toast — React Native toast notification system
 * Mirrors web components/Toast.tsx
 */
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const TOAST_CONFIG: Record<ToastType, { icon: string; color: string; bg: string }> = {
  success: { icon: 'check-circle', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  error: { icon: 'alert-circle', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  warning: { icon: 'alert', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  info: { icon: 'information', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const config = TOAST_CONFIG[toast.type];

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onRemove(toast.id));
    }, toast.duration);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.toast, { backgroundColor: config.bg, borderColor: config.color + '30', opacity: fadeAnim }]}>
      <Icon name={config.icon as any} size={20} color={config.color} />
      <Text style={[styles.toastText, { color: config.color }]}>{toast.message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={removeToast} />)}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 60, left: 16, right: 16, zIndex: 9999, gap: 8,
  },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1,
  },
  toastText: { fontSize: 13, fontWeight: '600', flex: 1 },
});
