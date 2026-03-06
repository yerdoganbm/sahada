/**
 * VenueStaffManagementScreen – Saha sahibi personel & muhasebeci yönetimi
 * Davet gönder, mevcut ekibi görüntüle, yetki değiştir/iptal et
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius } from '../theme';

type NavProp = StackNavigationProp<RootStackParamList, 'VenueStaffManagement'>;

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: 'venue_staff' | 'venue_accountant';
  status: 'active' | 'pending';
  addedAt: string;
}

const ROLE_META: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  venue_staff: {
    label: 'Personel',
    color: '#3B82F6',
    icon: 'badge-account-horizontal',
    desc: 'Rezervasyon, takvim, müşteri, bakım, mesaj',
  },
  venue_accountant: {
    label: 'Muhasebeci',
    color: '#8B5CF6',
    icon: 'calculator-variant',
    desc: 'Gelir raporları, analitik, kasa, audit log',
  },
};

const DEMO_STAFF: StaffMember[] = [
  { id: 's1', name: 'Serkan Yıldız', phone: '5000000098', role: 'venue_staff', status: 'active', addedAt: '2025-01-15' },
  { id: 's2', name: 'Ayşe Kaya', phone: '5000000097', role: 'venue_accountant', status: 'active', addedAt: '2025-02-01' },
];

export default function VenueStaffManagementScreen() {
  const navigation = useNavigation<NavProp>();
  const [staff, setStaff] = useState<StaffMember[]>(DEMO_STAFF);
  const [showInvite, setShowInvite] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<'venue_staff' | 'venue_accountant'>('venue_staff');
  const [inviteName, setInviteName] = useState('');
  const [sending, setSending] = useState(false);

  const fmtPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6)}`;
    return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6,8)} ${d.slice(8)}`;
  };

  const rawPhone = invitePhone.replace(/\D/g, '');
  const phoneValid = rawPhone.length === 10;
  const nameValid = inviteName.trim().length >= 2;
  const canSend = phoneValid && nameValid;

  const handleSendInvite = () => {
    if (!canSend) return;
    setSending(true);
    setTimeout(() => {
      const newMember: StaffMember = {
        id: 'inv_' + Date.now(),
        name: inviteName.trim(),
        phone: rawPhone,
        role: inviteRole,
        status: 'pending',
        addedAt: new Date().toISOString().slice(0, 10),
      };
      setStaff(prev => [newMember, ...prev]);
      setInvitePhone('');
      setInviteName('');
      setShowInvite(false);
      setSending(false);
    }, 800);
  };

  const handleRevoke = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const activeStaff = staff.filter(s => s.role === 'venue_staff');
  const activeAccountants = staff.filter(s => s.role === 'venue_accountant');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Ekip Yönetimi</Text>
          <Text style={styles.headerSubtitle}>Personel ve muhasebeci davet et, yetkilendir</Text>
        </View>
        <TouchableOpacity onPress={() => setShowInvite(true)} style={styles.inviteBtn}>
          <MaterialCommunityIcons name="account-plus" size={16} color="#fff" />
          <Text style={styles.inviteBtnText}>Davet Et</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {/* Role Explanation Cards */}
        <View style={styles.roleGrid}>
          {Object.entries(ROLE_META).map(([key, meta]) => (
            <View key={key} style={styles.roleCard}>
              <View style={styles.roleCardHeader}>
                <View style={[styles.roleIcon, { backgroundColor: meta.color + '18' }]}>
                  <MaterialCommunityIcons name={meta.icon as any} size={18} color={meta.color} />
                </View>
                <Text style={styles.roleLabel}>{meta.label}</Text>
              </View>
              <Text style={styles.roleDesc}>{meta.desc}</Text>
            </View>
          ))}
        </View>

        {/* Personel List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="badge-account-horizontal" size={16} color="#60A5FA" />
            <Text style={styles.sectionTitle}>Personel ({activeStaff.length})</Text>
          </View>
          {activeStaff.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="account-plus" size={32} color="#334155" />
              <Text style={styles.emptyText}>Henüz personel eklenmedi</Text>
            </View>
          ) : (
            activeStaff.map(s => (
              <StaffCard key={s.id} member={s} onRevoke={() => handleRevoke(s.id)} />
            ))
          )}
        </View>

        {/* Muhasebeci List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calculator-variant" size={16} color="#A78BFA" />
            <Text style={styles.sectionTitle}>Muhasebeci ({activeAccountants.length})</Text>
          </View>
          {activeAccountants.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="account-plus" size={32} color="#334155" />
              <Text style={styles.emptyText}>Henüz muhasebeci eklenmedi</Text>
            </View>
          ) : (
            activeAccountants.map(s => (
              <StaffCard key={s.id} member={s} onRevoke={() => handleRevoke(s.id)} />
            ))
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={16} color="#60A5FA" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Nasıl çalışır?</Text>
            <Text style={styles.infoItem}>• Davet ettiğiniz kişi uygulamaya girdiğinde otomatik olarak rolü atanır</Text>
            <Text style={styles.infoItem}>• Personel sadece günlük operasyonları yönetebilir</Text>
            <Text style={styles.infoItem}>• Muhasebeci sadece finansal raporlara erişebilir</Text>
            <Text style={styles.infoItem}>• Yetkileri istediğiniz zaman iptal edebilirsiniz</Text>
          </View>
        </View>
      </ScrollView>

      {/* Invite Modal */}
      <Modal visible={showInvite} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowInvite(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ekip Üyesi Davet Et</Text>
              <TouchableOpacity onPress={() => setShowInvite(false)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Role Selection */}
            <Text style={styles.fieldLabel}>Rol Seçin</Text>
            <View style={styles.roleSelectGrid}>
              {(['venue_staff', 'venue_accountant'] as const).map(role => {
                const meta = ROLE_META[role];
                const active = inviteRole === role;
                return (
                  <TouchableOpacity key={role} onPress={() => setInviteRole(role)}
                    style={[styles.roleSelectBtn, active && { borderColor: '#3B82F680', backgroundColor: '#3B82F618' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <MaterialCommunityIcons name={meta.icon as any} size={16} color={active ? meta.color : '#64748B'} />
                      <Text style={[styles.roleSelectLabel, active && { color: '#fff' }]}>{meta.label}</Text>
                    </View>
                    <Text style={styles.roleSelectDesc}>{meta.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Name */}
            <Text style={styles.fieldLabel}>Ad Soyad *</Text>
            <TextInput
              value={inviteName}
              onChangeText={setInviteName}
              placeholder="Serkan Yıldız"
              placeholderTextColor="#334155"
              style={styles.input}
            />

            {/* Phone */}
            <Text style={styles.fieldLabel}>Telefon Numarası *</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.phonePrefix}>+90</Text>
              <View style={styles.phoneDivider} />
              <TextInput
                value={invitePhone}
                onChangeText={v => setInvitePhone(fmtPhone(v))}
                placeholder="532 000 00 00"
                placeholderTextColor="#334155"
                keyboardType="phone-pad"
                style={styles.phoneInput}
              />
              {phoneValid && <MaterialCommunityIcons name="check-circle" size={18} color="#4ADE80" />}
            </View>

            {/* Send */}
            <TouchableOpacity
              onPress={handleSendInvite}
              disabled={!canSend || sending}
              style={[styles.sendBtn, canSend && styles.sendBtnActive]}>
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={16} color={canSend ? '#fff' : '#475569'} />
                  <Text style={[styles.sendBtnText, canSend && { color: '#fff' }]}>Davet Gönder</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.modalFooter}>
              Davet edilen kişi uygulamaya giriş yaptığında otomatik olarak yetkilendirilecektir.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Staff card component
const StaffCard: React.FC<{ member: StaffMember; onRevoke: () => void }> = ({ member, onRevoke }) => {
  const meta = ROLE_META[member.role];
  const fmtPhone = member.phone.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  return (
    <View style={styles.staffCard}>
      <View style={[styles.avatar, { backgroundColor: meta.color + '18' }]}>
        <Text style={[styles.avatarText, { color: meta.color }]}>{member.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.staffName}>{member.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: meta.color + '15', borderColor: meta.color + '30' }]}>
            <Text style={[styles.roleBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          {member.status === 'pending' && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Bekliyor</Text>
            </View>
          )}
        </View>
        <Text style={styles.staffPhone}>+90 {fmtPhone}</Text>
      </View>
      <TouchableOpacity onPress={onRevoke} style={styles.revokeBtn}>
        <MaterialCommunityIcons name="account-remove" size={16} color="#F87171" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#64748B',
    fontSize: 11,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  inviteBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: 20,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 14,
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  roleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  roleDesc: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 14,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
  },
  staffCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  staffName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  pendingBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F59E0B',
  },
  staffPhone: {
    color: '#475569',
    fontSize: 10,
    marginTop: 2,
  },
  revokeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(59,130,246,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    borderRadius: borderRadius.md,
    padding: 14,
  },
  infoTitle: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoItem: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 16,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  roleSelectGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  roleSelectBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surface,
  },
  roleSelectLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  roleSelectDesc: {
    color: '#475569',
    fontSize: 9,
    lineHeight: 13,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 14,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  phonePrefix: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '700',
  },
  phoneDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  phoneInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    padding: 0,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sendBtnActive: {
    backgroundColor: '#3B82F6',
  },
  sendBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '900',
  },
  modalFooter: {
    color: '#475569',
    fontSize: 10,
    textAlign: 'center',
  },
});
