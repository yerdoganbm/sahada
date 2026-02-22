/**
 * CustomerManagementScreen – Müşteri/üye listesi (Firestore)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
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
import { getPlayers } from '../services/players';
import type { Player } from '../types';

type CustomerManagementNavProp = StackNavigationProp<RootStackParamList, 'CustomerManagement'>;

export default function CustomerManagementScreen() {
  const navigation = useNavigation<CustomerManagementNavProp>();
  const { user } = useAuth();
  const teamId = user?.teamId;
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlayers = useCallback(async () => {
    if (!teamId) {
      setPlayers([]);
      setLoading(false);
      return;
    }
    const list = await getPlayers({ teamId });
    setPlayers(list);
  }, [teamId]);

  useEffect(() => {
    setLoading(true);
    fetchPlayers().finally(() => setLoading(false));
  }, [fetchPlayers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlayers();
    setRefreshing(false);
  }, [fetchPlayers]);

  if (!teamId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Müşteri Yönetimi</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={[styles.centered, styles.flex1]}>
          <Icon name="account-group-outline" size={64} color={colors.text.disabled} />
          <Text style={styles.emptyText}>Takıma katılmadan liste görüntülenemez</Text>
        </View>
      </View>
    );
  }

  if (loading && players.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Müşteri Yönetimi</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateProfile')}
        >
          <Icon name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {players.length === 0 ? (
        <View style={[styles.centered, styles.flex1]}>
          <Icon name="account-multiple-outline" size={64} color={colors.text.disabled} />
          <Text style={styles.emptyText}>Henüz üye yok</Text>
          <TouchableOpacity
            style={styles.addProfileBtn}
            onPress={() => navigation.navigate('CreateProfile')}
          >
            <Text style={styles.addProfileBtnText}>Yeni Profil Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ProfileDetails', { userId: item.id })}
            >
              <Image
                source={{ uri: item.avatar || `https://i.pravatar.cc/150?u=${item.id}` }}
                style={styles.avatar}
              />
              <View style={styles.cardContent}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.meta}>
                  <Text style={styles.position}>{item.position}</Text>
                  <Text style={styles.role}>{item.role}</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color={colors.text.disabled} />
            </TouchableOpacity>
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
  addBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  list: { padding: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  cardContent: { flex: 1, marginLeft: spacing.md },
  name: { ...typography.body, color: colors.text.primary, fontWeight: '600' },
  meta: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  position: { ...typography.caption, color: colors.text.secondary },
  role: { ...typography.caption, color: colors.primary },
  addProfileBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  addProfileBtnText: { ...typography.button, color: '#fff' },
});
