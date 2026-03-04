import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Reservation, MatchRSVP, MemberContribution, Team } from '../types';

interface Props {
  currentUserId: string;
  currentUserName: string;
  teams: Team[];
  reservations: Reservation[];
  memberContributions: MemberContribution[];
  matchRsvps: MatchRSVP[];
  onMatchPress: (reservationId: string) => void;
  onJoinTeam: () => void;
  onPayments: () => void;
}

export const MemberHomeScreen: React.FC<Props> = ({
  currentUserId, currentUserName, teams, reservations,
  memberContributions, matchRsvps,
  onMatchPress, onJoinTeam, onPayments,
}) => {
  const myTeams = teams.filter(t => t.memberUserIds.includes(currentUserId));
  const myTeamIds = myTeams.map(t => t.id);
  const today = new Date().toISOString().split('T')[0];

  const upcoming = reservations
    .filter(r => r.teamId && myTeamIds.includes(r.teamId) && r.date >= today && r.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const totalUnpaid = memberContributions
    .filter(c => c.memberUserId === currentUserId)
    .reduce((s, c) => s + Math.max(0, c.expectedAmount - c.paidAmount), 0);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Merhaba, {currentUserName.split(' ')[0]} 👋</Text>
            <Text style={s.subtitle}>{myTeams.length} takım · {upcoming.length} yaklaşan maç</Text>
          </View>
          <TouchableOpacity onPress={onPayments} style={s.payBtn}>
            <Text style={s.payBtnText}>💰</Text>
            {totalUnpaid > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>!</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Debt banner */}
        {totalUnpaid > 0 && (
          <TouchableOpacity onPress={onPayments} style={s.debtBanner}>
            <Text style={s.debtText}>⚠️ {totalUnpaid.toLocaleString('tr-TR')}₺ bekleyen ödeme</Text>
            <Text style={s.debtSub}>Kaptana ödemen gereken tutar →</Text>
          </TouchableOpacity>
        )}

        {/* Upcoming matches */}
        <Text style={s.sectionTitle}>Yaklaşan Maçlar</Text>
        {upcoming.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>⚽ Henüz maç yok</Text>
            <Text style={s.emptySubText}>Takıma katılınca maçlar burada görünür</Text>
          </View>
        ) : (
          upcoming.map(res => {
            const contrib = memberContributions.find(c => c.reservationId === res.id && c.memberUserId === currentUserId);
            const rsvp = matchRsvps.find(r => r.reservationId === res.id && r.userId === currentUserId);
            const remaining = contrib ? contrib.expectedAmount - contrib.paidAmount : 0;
            return (
              <TouchableOpacity key={res.id} onPress={() => onMatchPress(res.id)} style={s.matchCard}>
                <View style={s.matchTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.matchVenue}>{res.venueName}</Text>
                    <Text style={s.matchDate}>{res.date} · {res.startTime}</Text>
                  </View>
                  {rsvp && rsvp.status !== 'unset' && (
                    <Text style={[s.rsvpBadge,
                      rsvp.status === 'going' ? s.rsvpGoing :
                      rsvp.status === 'not_going' ? s.rsvpNot : s.rsvpMaybe
                    ]}>
                      {rsvp.status === 'going' ? '✓ GELİYORUM' : rsvp.status === 'not_going' ? '✗ GELEMİYORUM' : '? BELİRSİZ'}
                    </Text>
                  )}
                </View>
                {contrib && (
                  <Text style={[s.payStatus, remaining > 0 ? s.payRed : s.payGreen]}>
                    {remaining > 0 ? `${remaining}₺ kaldı` : 'Ödendi ✓'}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })
        )}

        {/* Join CTA */}
        <TouchableOpacity onPress={onJoinTeam} style={s.joinBtn}>
          <Text style={s.joinBtnText}>🔗  Davet Koduyla Takıma Katıl</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 20, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  payBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  payBtnText: { fontSize: 18 },
  badge: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  debtBanner: { backgroundColor: '#EF444415', borderColor: '#EF444430', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 16 },
  debtText: { color: '#F87171', fontWeight: 'bold', fontSize: 13 },
  debtSub: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  emptyBox: { backgroundColor: '#1E293B', borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyText: { color: '#475569', fontSize: 14, fontWeight: 'bold' },
  emptySubText: { color: '#334155', fontSize: 12, marginTop: 4, textAlign: 'center' },
  matchCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 14, marginBottom: 10 },
  matchTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  matchVenue: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  matchDate: { color: '#64748B', fontSize: 12, marginTop: 2 },
  rsvpBadge: { fontSize: 9, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  rsvpGoing: { backgroundColor: '#10B98120', color: '#34D399' },
  rsvpNot: { backgroundColor: '#EF444415', color: '#F87171' },
  rsvpMaybe: { backgroundColor: '#F59E0B15', color: '#FBBF24' },
  payStatus: { fontSize: 12, fontWeight: 'bold' },
  payRed: { color: '#F87171' },
  payGreen: { color: '#34D399' },
  joinBtn: { backgroundColor: '#FACC1515', borderColor: '#FACC1530', borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 16 },
  joinBtnText: { color: '#FACC15', fontWeight: 'bold', fontSize: 14 },
});
