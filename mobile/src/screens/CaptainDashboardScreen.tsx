import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView
} from 'react-native';
import { Team, Reservation, MemberContribution, CaptainPaymentPlan } from '../types';

interface Props {
  currentUserId: string;
  teams: Team[];
  reservations: Reservation[];
  memberContributions: MemberContribution[];
  captainPaymentPlans: CaptainPaymentPlan[];
  onNewBooking: () => void;
  onTeamManage: () => void;
  onMatchPress: (reservationId: string) => void;
  onOutbox: () => void;
}

export const CaptainDashboardScreen: React.FC<Props> = ({
  currentUserId, teams, reservations, memberContributions, captainPaymentPlans,
  onNewBooking, onTeamManage, onMatchPress, onOutbox,
}) => {
  const myTeams = teams.filter(t => t.captainUserId === currentUserId);
  const today = new Date().toISOString().split('T')[0];

  const upcoming = reservations
    .filter(r => r.date >= today && r.status !== 'cancelled' && myTeams.some(t => t.id === r.teamId))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.heading}>Kaptan Paneli ⚽</Text>
        <Text style={s.sub}>{myTeams.length} takım · {upcoming.length} yaklaşan maç</Text>

        {/* Quick actions */}
        <View style={s.actions}>
          {[
            { label: '📅 Maç Planla', onPress: onNewBooking },
            { label: '👥 Takımlar', onPress: onTeamManage },
            { label: '📨 Outbox', onPress: onOutbox },
          ].map(a => (
            <TouchableOpacity key={a.label} onPress={a.onPress} style={s.actionBtn}>
              <Text style={s.actionBtnText}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>Yaklaşan Maçlar</Text>
        {upcoming.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>Henüz maç yok. Yeni rezervasyon oluştur.</Text>
          </View>
        ) : (
          upcoming.map(res => {
            const contribs = memberContributions.filter(c => c.reservationId === res.id);
            const paid = contribs.reduce((s, c) => s + c.paidAmount, 0);
            const total = contribs.reduce((s, c) => s + c.expectedAmount, 0);
            const unpaidCount = contribs.filter(c => c.status !== 'paid').length;
            const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

            return (
              <TouchableOpacity key={res.id} onPress={() => onMatchPress(res.id)} style={s.card}>
                <Text style={s.cardVenue}>{res.venueName}</Text>
                <Text style={s.cardDate}>{res.date} · {res.startTime}</Text>
                <View style={s.progressBg}>
                  <View style={[s.progressFill, { width: `${pct}%` as any }]} />
                </View>
                <Text style={s.cardStats}>{paid.toLocaleString('tr-TR')}₺ / {total.toLocaleString('tr-TR')}₺ · {unpaidCount > 0 ? `${unpaidCount} eksik` : '✓ Tamamlandı'}</Text>
                <View style={s.venueTag}>
                  <Text style={s.venueTagText}>{res.status === 'confirmed' ? '✓ Onaylı' : '⏳ Onay Bekleniyor'}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4 },
  sub: { fontSize: 12, color: '#64748B', marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  actionBtn: { flex: 1, backgroundColor: '#1E293B', borderRadius: 14, padding: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  emptyBox: { backgroundColor: '#1E293B', borderRadius: 16, padding: 24, alignItems: 'center' },
  emptyText: { color: '#475569', fontSize: 13, textAlign: 'center' },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 14, marginBottom: 10 },
  cardVenue: { color: '#fff', fontWeight: '900', fontSize: 15, marginBottom: 2 },
  cardDate: { color: '#64748B', fontSize: 12, marginBottom: 10 },
  progressBg: { height: 4, backgroundColor: '#334155', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#FACC15', borderRadius: 2 },
  cardStats: { color: '#94A3B8', fontSize: 11, marginBottom: 6 },
  venueTag: { alignSelf: 'flex-start', backgroundColor: '#FACC1510', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  venueTagText: { color: '#FACC15', fontSize: 10, fontWeight: 'bold' },
});
