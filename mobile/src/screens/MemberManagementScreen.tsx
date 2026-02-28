/**
 * Member Management Screen – Üye listesi, katılım istekleri, rol değiştirme, davet
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  Share,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { addManualPlayer } from '../services/players';
import {
  listJoinRequestsWithUsers,
  approveJoinRequestViaCF,
  rejectJoinRequestViaCF,
  type CanonicalJoinRequestWithUser,
} from '../services/canonicalJoinRequestApi';
import { listActiveTeamMembers, type TeamMember } from '../services/teamMembers';
import { changeMemberRole } from '../services/memberRoleService';
import { getTeamById } from '../services/firestore';
import { createInviteToken } from '../services/inviteFunctions';
import AppScrollView from '../components/AppScrollView';
import { colors, spacing, borderRadius, typography } from '../theme';
import type { Player } from '../types';

const POS_LABEL: Record<string, string> = { GK: 'Kaleci', DEF: 'Defans', MID: 'Orta Saha', FWD: 'Forvet' };
const POSITIONS: Array<'GK' | 'DEF' | 'MID' | 'FWD'> = ['GK', 'DEF', 'MID', 'FWD'];

export default function MemberManagementScreen() {
  const navigation = useNavigation();
  const { user, memberships, activeTeamId } = useAuth();
  const myMembership = activeTeamId ? memberships.find((m) => m.teamId === activeTeamId) : null;
  const myRoleId = myMembership?.roleId ?? null;
  const canManage = myRoleId === 'TEAM_OWNER' || myRoleId === 'TEAM_ADMIN';

  const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');
  const [players, setPlayers] = useState<TeamMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<CanonicalJoinRequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [inviteTargetValue, setInviteTargetValue] = useState('');
  const [creatingToken, setCreatingToken] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState<'GK' | 'DEF' | 'MID' | 'FWD'>('MID');
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    const teamId = activeTeamId ?? user.teamId ?? null;
    if (!teamId) {
      setPlayers([]);
      setInviteCode('SAHADA-2024');
      setJoinRequests([]);
      return;
    }

    const [list, team, requests] = await Promise.all([
      listActiveTeamMembers(teamId),
      getTeamById(teamId),
      listJoinRequestsWithUsers(teamId),
    ]);
    setPlayers(list);
    setInviteCode(team?.inviteCode ?? 'SAHADA-2024');
    setJoinRequests(requests);
  }, [user?.id, activeTeamId, user?.teamId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchData().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleCopyInvite = () => {
    Alert.alert(
      'Davet Kodu',
      `Davet kodunu paylaşmak için "Paylaş" butonunu kullanın.\n\nKod: ${inviteCode || 'SAHADA-2024'}`,
      [{ text: 'Tamam', onPress: () => setShowInviteModal(false) }]
    );
  };

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Sahada takıma katıl! Davet kodu: ${inviteCode}`,
        title: 'Sahada Daveti',
      });
      setShowInviteModal(false);
    } catch {
      await handleCopyInvite();
    }
  };

  const handleCreateTokenInvite = async () => {
    const teamId = activeTeamId ?? user?.teamId ?? null;
    if (!teamId || !user?.id) return;
    setCreatingToken(true);
    try {
      const res = await createInviteToken({
        teamId,
        targetValue: inviteTargetValue,
        roleId: 'MEMBER',
        ttlHours: 48,
      });
      await Share.share({
        message: `Sahada takıma katıl! Davet tokenı: ${res.token}`,
        title: 'Sahada Daveti (Token)',
      });
      setInviteTargetValue('');
      setShowInviteModal(false);
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Token davet oluşturulamadı.');
    } finally {
      setCreatingToken(false);
    }
  };

  const handleAddManualPlayer = async () => {
    if (!newPlayerName.trim() || !user?.id) return;
    const teamId = activeTeamId ?? user.teamId ?? null;
    if (!teamId) {
      Alert.alert('Hata', 'Takım bilgisi bulunamadı.');
      return;
    }
    setAddingPlayer(true);
    try {
      const added = await addManualPlayer(teamId, { name: newPlayerName.trim(), position: newPlayerPos });
      if (added) {
        setPlayers((prev) => [...prev, { ...added, roleId: 'MEMBER', membershipId: `${teamId}_${added.id}` }]);
        setNewPlayerName('');
        setShowAddModal(false);
        Alert.alert('Başarılı', 'Oyuncu eklendi.');
      } else {
        Alert.alert('Hata', 'Oyuncu eklenemedi.');
      }
    } finally {
      setAddingPlayer(false);
    }
  };

  const handleRoleChange = async (member: TeamMember, desiredRoleId: string) => {
    const teamId = activeTeamId ?? user?.teamId ?? null;
    if (!canManage || !teamId) return;
    if (user?.id === member.id) return;
    try {
      await changeMemberRole({ teamId, userId: member.id, roleId: desiredRoleId });
      setPlayers((prev) =>
        prev.map((p) => (p.id === member.id ? { ...p, roleId: desiredRoleId } : p))
      );
      setSelectedMember(null);
      Alert.alert('Başarılı', 'Yetki güncellendi.');
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Yetki güncellenemedi.');
    }
  };

  const handleApproveRequest = async (req: CanonicalJoinRequestWithUser) => {
    if (!canManage) return;
    setRequestActionId(req.id);
    try {
      await approveJoinRequestViaCF(req.id);
      setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
      await fetchData();
      Alert.alert('Başarılı', `${req.userName} takıma eklendi.`);
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'İstek onaylanamadı.');
    } finally {
      setRequestActionId(null);
    }
  };

  const handleRejectRequest = async (req: CanonicalJoinRequestWithUser) => {
    if (!canManage) return;
    setRequestActionId(req.id);
    try {
      await rejectJoinRequestViaCF(req.id);
      setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
      Alert.alert('Reddedildi', `${req.userName} isteği reddedildi.`);
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'İstek reddedilemedi.');
    } finally {
      setRequestActionId(null);
    }
  };

  const renderRoleBadge = (p: TeamMember) => {
    if (p.roleId === 'TEAM_OWNER')
      return (
        <View style={styles.roleBadgeAdmin}>
          <Icon name="crown" size={12} color="#F59E0B" />
          <Text style={styles.roleBadgeAdminText}>Owner</Text>
        </View>
      );
    if (p.roleId === 'TEAM_ADMIN')
      return (
        <View style={styles.roleBadgeAdmin}>
          <Icon name="shield-account" size={12} color="#A78BFA" />
          <Text style={styles.roleBadgeAdminText}>Yönetici</Text>
        </View>
      );
    if (p.roleId === 'CAPTAIN')
      return (
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Kaptan</Text>
        </View>
      );
    return (
      <View style={styles.roleBadge}>
        <Text style={styles.roleBadgeText}>Oyuncu</Text>
      </View>
    );
  };

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grup Üyeleri</Text>
        {canManage ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('ScoutDashboard')}
            >
              <Icon name="binoculars" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => setShowAddModal(true)}>
              <Icon name="account-plus" size={22} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={() => {
                setInviteCode(inviteCode || 'SAHADA-2024');
                setShowInviteModal(true);
              }}
            >
              <Text style={styles.inviteBtnText}>Davet Et</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.tabActive]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
            Üye Listesi ({players.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <View style={styles.tabWithBadge}>
            <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
              İstekler
            </Text>
            {joinRequests.length > 0 && <View style={styles.badge} />}
          </View>
        </TouchableOpacity>
      </View>

      <AppScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'members' && (
          <>
            {players.length === 0 ? (
              <View style={styles.empty}>
                <Icon name="account-group" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyTitle}>Takımın Henüz Boş</Text>
                <Text style={styles.emptySub}>Manuel ekle veya davet kodu paylaş.</Text>
              </View>
            ) : (
              players.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.memberRow}
                  onPress={() => setSelectedMember(p)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: p.avatar || `https://i.pravatar.cc/150?u=${p.id}` }}
                    style={styles.avatar}
                  />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {p.name} {p.id === user?.id && '(Sen)'}
                    </Text>
                    <Text style={styles.memberPos}>{POS_LABEL[p.position] || p.position}</Text>
                  </View>
                  {renderRoleBadge(p)}
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <View style={styles.requests}>
            {joinRequests.length === 0 ? (
              <View style={styles.empty}>
                <Icon name="inbox" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyTitle}>Bekleyen katılım isteği yok</Text>
                <Text style={styles.emptySub}>
                  Takıma katılmak isteyenler uygulamada davet kodu ile istek gönderebilir (onay gerekli takımlarda). Yeni davet için "Davet Et" kullanın.
                </Text>
              </View>
            ) : (
              joinRequests.map((req) => (
                <View key={req.id} style={styles.requestCard}>
                  <Image
                    source={{ uri: req.userAvatar || `https://i.pravatar.cc/150?u=${req.userId}` }}
                    style={styles.requestAvatar}
                  />
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>{req.userName}</Text>
                    <Text style={styles.requestMeta}>
                      {req.userPosition ? POS_LABEL[req.userPosition] || req.userPosition : ''}
                      {req.userPhone ? ` • ${req.userPhone}` : ''}
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.rejectBtn, requestActionId === req.id && styles.btnDisabled]}
                      onPress={() => handleRejectRequest(req)}
                      disabled={!!requestActionId || !canManage}
                    >
                      <Text style={styles.rejectBtnText}>
                        {requestActionId === req.id ? '...' : 'Reddet'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.approveBtn, requestActionId === req.id && styles.btnDisabled]}
                      onPress={() => handleApproveRequest(req)}
                      disabled={!!requestActionId || !canManage}
                    >
                      <Text style={styles.approveBtnText}>
                        {requestActionId === req.id ? '...' : 'Onayla'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </AppScrollView>

      {/* Invite Modal */}
      <Modal visible={showInviteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Davet Kodu</Text>
            <View style={styles.inviteCodeBox}>
              <Text style={styles.inviteCodeText}>{inviteCode || 'SAHADA-2024'}</Text>
            </View>
            <Text style={styles.modalSub}>
              Bu kodu arkadaşınla paylaş, "Takıma Katıl" ekranından giriş yapsın.
            </Text>
            <TouchableOpacity style={styles.primaryModalBtn} onPress={handleShareInvite}>
              <Text style={styles.primaryModalBtnText}>Paylaş</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryModalBtn} onPress={handleCopyInvite}>
              <Text style={styles.secondaryModalBtnText}>Kopyala</Text>
            </TouchableOpacity>

            {canManage && (
              <>
                <View style={{ height: 16 }} />
                <Text style={styles.modalTitle}>Token Davet (Tek Kullanımlık)</Text>
                <Text style={styles.modalSub}>
                  Üretilecek token, üretimden sonra paylaşıldığında 1 kez kullanılabilir.
                </Text>
                <Text style={styles.inputLabel}>Hedef (telefon veya email)</Text>
                <TextInput
                  style={styles.input}
                  value={inviteTargetValue}
                  onChangeText={setInviteTargetValue}
                  placeholder="örn: 5551234567 veya ali@ornek.com"
                  placeholderTextColor={colors.text.tertiary}
                  editable={!creatingToken}
                />
                <TouchableOpacity
                  style={styles.primaryModalBtn}
                  onPress={handleCreateTokenInvite}
                  disabled={creatingToken || !inviteTargetValue.trim()}
                >
                  <Text style={styles.primaryModalBtnText}>
                    {creatingToken ? 'Oluşturuluyor...' : 'Token Oluştur & Paylaş'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowInviteModal(false)}>
              <Text style={styles.closeBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Player Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Manuel Oyuncu Ekle</Text>
            <Text style={styles.modalSub}>Uygulamayı kullanmayan birini ekle.</Text>
            <Text style={styles.inputLabel}>Ad Soyad</Text>
            <TextInput
              style={styles.input}
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              placeholder="Örn: Mehmet"
              placeholderTextColor={colors.text.tertiary}
            />
            <Text style={styles.inputLabel}>Mevki</Text>
            <View style={styles.posRow}>
              {POSITIONS.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  style={[styles.posBtn, newPlayerPos === pos && styles.posBtnActive]}
                  onPress={() => setNewPlayerPos(pos)}
                >
                  <Text style={[styles.posBtnText, newPlayerPos === pos && styles.posBtnTextActive]}>
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowAddModal(false)}
                disabled={addingPlayer}
              >
                <Text style={styles.cancelModalBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryModalBtn}
                onPress={handleAddManualPlayer}
                disabled={!newPlayerName.trim() || addingPlayer}
              >
                {addingPlayer ? (
                  <ActivityIndicator size="small" color={colors.secondary} />
                ) : (
                  <Text style={styles.primaryModalBtnText}>Ekle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Member Detail Modal */}
      <Modal visible={!!selectedMember} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedMember(null)}
        >
          <View style={styles.memberModal} onStartShouldSetResponder={() => true}>
            {selectedMember && (
              <>
                <View style={styles.memberModalHeader}>
                  <TouchableOpacity
                    style={styles.closeIconBtn}
                    onPress={() => setSelectedMember(null)}
                  >
                    <Icon name="close" size={20} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>
                <Image
                  source={{
                    uri:
                      selectedMember.avatar ||
                      `https://i.pravatar.cc/150?u=${selectedMember.id}`,
                  }}
                  style={styles.memberModalAvatar}
                />
                <Text style={styles.memberModalName}>
                  {selectedMember.name}{' '}
                  {selectedMember.roleId === 'TEAM_ADMIN' && (
                    <Icon name="shield-check" size={20} color="#A78BFA" />
                  )}
                </Text>
                <Text style={styles.memberModalMeta}>
                  {selectedMember.roleId === 'TEAM_OWNER'
                    ? 'Owner'
                    : selectedMember.roleId === 'TEAM_ADMIN'
                      ? 'Yönetici'
                      : selectedMember.roleId === 'CAPTAIN'
                        ? 'Kaptan'
                        : 'Oyuncu'}{' '}
                  •{' '}
                  {POS_LABEL[selectedMember.position]}
                </Text>
                {canManage && user?.id !== selectedMember.id && (
                  <View style={styles.roleActions}>
                    {selectedMember.roleId !== 'TEAM_ADMIN' ? (
                      <TouchableOpacity
                        style={styles.roleActionBtn}
                        onPress={() => handleRoleChange(selectedMember, 'TEAM_ADMIN')}
                      >
                        <Icon name="shield-account" size={18} color="#A78BFA" />
                        <Text style={styles.roleActionBtnText}>Yönetici Yap</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.roleActionBtn}
                        onPress={() => handleRoleChange(selectedMember, 'MEMBER')}
                      >
                        <Icon name="account" size={18} color={colors.text.secondary} />
                        <Text style={styles.roleActionBtnText}>Yönetici Yetkisini Al</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {user?.id === selectedMember.id && (
                  <View style={styles.ownProfileBadge}>
                    <Text style={styles.ownProfileText}>Profiliniz</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, fontSize: typography.fontSize.sm, color: colors.text.secondary },
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
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  inviteBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.secondary,
  },
  placeholder: { width: 40 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: 4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.background.tertiary },
  tabText: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.text.secondary },
  tabTextActive: { color: colors.text.primary },
  tabWithBadge: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  content: { flex: 1 },
  contentInner: { padding: spacing.lg, paddingBottom: 100 },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptySub: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  memberInfo: { flex: 1, marginLeft: spacing.md },
  memberName: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text.primary },
  memberPos: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
  },
  roleBadgeText: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.text.secondary },
  roleBadgeAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  roleBadgeAdminText: { fontSize: typography.fontSize.xs, fontWeight: '700', color: '#A78BFA' },
  requests: { gap: spacing.md },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  requestAvatar: { width: 40, height: 40, borderRadius: 20, marginBottom: spacing.sm },
  requestInfo: { marginBottom: spacing.md },
  requestName: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text.primary },
  requestMeta: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  requestActions: { flexDirection: 'row', gap: spacing.sm },
  rejectBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
  },
  rejectBtnText: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.error },
  approveBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  approveBtnText: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.secondary },
  btnDisabled: { opacity: 0.6 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inviteCodeBox: {
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  inviteCodeText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 4,
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.lg,
  },
  posRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  posBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  posBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  posBtnText: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.text.secondary },
  posBtnTextActive: { color: colors.secondary },
  primaryModalBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryModalBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.secondary,
  },
  secondaryModalBtn: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  secondaryModalBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  closeBtn: { paddingVertical: spacing.sm, alignItems: 'center' },
  closeBtnText: { fontSize: typography.fontSize.sm, color: colors.text.tertiary },
  modalActions: { flexDirection: 'row', gap: spacing.md },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  cancelModalBtnText: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text.secondary },

  memberModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginTop: 'auto',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  memberModalHeader: { alignItems: 'flex-end', marginBottom: spacing.md },
  closeIconBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberModalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  memberModalName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  memberModalMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  roleActions: { gap: spacing.sm },
  roleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  roleActionBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  ownProfileBadge: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
  },
  ownProfileText: { fontSize: typography.fontSize.sm, color: colors.text.secondary },
});
