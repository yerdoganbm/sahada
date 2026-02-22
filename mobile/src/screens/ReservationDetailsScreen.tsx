/**
 * ReservationDetailsScreen – Rezervasyon detayı, onay/iptal (Firestore)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { getReservationById, updateReservationStatus, type Reservation } from '../services/firestore';
import { hapticLight } from '../utils/haptic';
import AlertModal from '../components/AlertModal';

type ReservationDetailsNavProp = StackNavigationProp<RootStackParamList, 'ReservationDetails'>;
type ReservationDetailsRoute = RouteProp<RootStackParamList, 'ReservationDetails'>;

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  completed: 'Tamamlandı',
  cancelled: 'İptal edildi',
};

const STATUS_COLORS: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.success,
  completed: colors.text.tertiary,
  cancelled: colors.error,
};

export default function ReservationDetailsScreen() {
  const navigation = useNavigation<ReservationDetailsNavProp>();
  const route = useRoute<ReservationDetailsRoute>();
  const reservationId = route.params?.reservationId;
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'error' | 'success';
  } | null>(null);

  const fetchReservation = useCallback(async () => {
    if (!reservationId) {
      setReservation(null);
      setLoading(false);
      return;
    }
    const r = await getReservationById(reservationId);
    setReservation(r);
    setLoading(false);
  }, [reservationId]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  const handleStatusUpdate = async (status: 'confirmed' | 'cancelled') => {
    if (!reservationId || !reservation) return;
    hapticLight();
    setActionLoading(true);
    try {
      await updateReservationStatus(reservationId, status);
      setReservation({ ...reservation, status });
      setAlert({
        title: status === 'confirmed' ? 'Onaylandı' : 'İptal edildi',
        message: status === 'confirmed' ? 'Rezervasyon onaylandı.' : 'Rezervasyon iptal edildi.',
        type: 'success',
      });
    } catch (err) {
      console.error('Update reservation error:', err);
      setAlert({
        title: 'Hata',
        message: (err as Error).message ?? 'İşlem yapılamadı.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!reservationId || !reservation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rezervasyon Detayı</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={[styles.centered, styles.flex1]}>
          <Icon name="calendar-remove" size={64} color={colors.text.disabled} />
          <Text style={styles.emptyText}>Rezervasyon bulunamadı</Text>
        </View>
      </View>
    );
  }

  const canUpdate = reservation.status === 'pending';
  const statusLabel = STATUS_LABELS[reservation.status] ?? reservation.status;

  return (
    <>
      <AlertModal
        visible={!!alert}
        title={alert?.title ?? ''}
        message={alert?.message ?? ''}
        type={alert?.type ?? 'info'}
        onConfirm={() => {
          setAlert(null);
          if (alert?.type === 'success') fetchReservation();
        }}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rezervasyon Detayı</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Saha</Text>
              <Text style={styles.value}>{reservation.venueName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tarih</Text>
              <Text style={styles.value}>{reservation.date}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Saat</Text>
              <Text style={styles.value}>
                {reservation.startTime} – {reservation.endTime}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ücret</Text>
              <Text style={styles.value}>₺{reservation.price}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Durum</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[reservation.status] ?? colors.warning }]}>
                <Text style={styles.statusText}>{statusLabel}</Text>
              </View>
            </View>
            {reservation.teamName && (
              <View style={styles.row}>
                <Text style={styles.label}>Takım</Text>
                <Text style={styles.value}>{reservation.teamName}</Text>
              </View>
            )}
          </View>

          {canUpdate && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnConfirm, actionLoading && styles.btnDisabled]}
                onPress={() => handleStatusUpdate('confirmed')}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="check" size={20} color="#fff" />
                    <Text style={styles.btnText}>Onayla</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel, actionLoading && styles.btnDisabled]}
                onPress={() => handleStatusUpdate('cancelled')}
                disabled={actionLoading}
              >
                <Icon name="close" size={20} color="#fff" />
                <Text style={styles.btnText}>İptal Et</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  flex1: { flex: 1 },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: { ...typography.body, color: colors.text.secondary, marginTop: spacing.md },
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
  content: { flex: 1 },
  contentInner: { padding: spacing.lg },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  label: { ...typography.caption, color: colors.text.secondary },
  value: { ...typography.body, color: colors.text.primary },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: { ...typography.caption, color: '#fff', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: spacing.md },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  btnConfirm: { backgroundColor: colors.success },
  btnCancel: { backgroundColor: colors.error },
  btnDisabled: { opacity: 0.7 },
  btnText: { ...typography.button, color: '#fff' },
});
