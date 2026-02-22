/**
 * SubscriptionScreen – Abonelik planları (Firestore)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { getSubscriptionPlans, type SubscriptionPlan } from '../services/firestore';

type SubscriptionNavProp = StackNavigationProp<RootStackParamList, 'Subscription'>;

const TIER_LABELS: Record<string, string> = {
  free: 'Ücretsiz',
  premium: 'Premium',
  partner: 'Partner',
};

export default function SubscriptionScreen() {
  const navigation = useNavigation<SubscriptionNavProp>();
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentTier = user?.tier ?? 'free';

  const fetchPlans = useCallback(async () => {
    const list = await getSubscriptionPlans();
    setPlans(list);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPlans().finally(() => setLoading(false));
  }, [fetchPlans]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlans();
    setRefreshing(false);
  }, [fetchPlans]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Abonelik</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.currentCard}>
        <Icon name="crown" size={32} color={colors.primary} />
        <View style={styles.currentContent}>
          <Text style={styles.currentLabel}>Mevcut plan</Text>
          <Text style={styles.currentTier}>{TIER_LABELS[currentTier] ?? currentTier}</Text>
        </View>
      </View>

      {loading && plans.length === 0 ? (
        <View style={[styles.centered, styles.flex1]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Planlar yükleniyor...</Text>
        </View>
      ) : plans.length === 0 ? (
        <View style={[styles.centered, styles.flex1]}>
          <Icon name="package-variant" size={64} color={colors.text.disabled} />
          <Text style={styles.emptyText}>Henüz plan bulunmuyor</Text>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <View style={[styles.planCard, item.tier === currentTier && styles.planCardActive]}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{item.name}</Text>
                {item.price != null && item.price > 0 && (
                  <Text style={styles.planPrice}>₺{item.price}/ay</Text>
                )}
              </View>
              {item.description ? (
                <Text style={styles.planDesc}>{item.description}</Text>
              ) : null}
              {item.features?.length ? (
                <View style={styles.features}>
                  {item.features.slice(0, 4).map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Icon name="check" size={16} color={colors.primary} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  flex1: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
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
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  currentContent: { marginLeft: spacing.md },
  currentLabel: { ...typography.caption, color: colors.text.secondary },
  currentTier: { ...typography.h3, color: colors.text.primary },
  list: { padding: spacing.lg, paddingTop: 0 },
  planCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  planCardActive: { borderWidth: 2, borderColor: colors.primary },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  planName: { ...typography.h3, color: colors.text.primary },
  planPrice: { ...typography.body, color: colors.primary },
  planDesc: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.sm },
  features: { marginTop: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  featureText: { ...typography.caption, color: colors.text.secondary },
});
