import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, SafeAreaView, Alert
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Reservation, MemberContribution, CaptainPayoutProfile, MatchRSVP } from '../types';

interface Props {
  reservationId: string;
  currentUserId: string;
  reservations: Reservation[];
  memberContributions: MemberContribution[];
  captainPayoutProfiles: CaptainPayoutProfile[];
  matchRsvps: MatchRSVP[];
  onBack: () => void;
  onSetRSVP: (reservationId: string, status: MatchRSVP['status']) => void;
  onSubmitProof: (reservationId: string, proofUrl: string, note?: string) => void;
}

const RSVP_OPTIONS = [
  { status: 'going' as const, label: 'Geliyorum', color: '#34D399', bg: '#10B98120' },
  { status: 'maybe' as const, label: 'Belki', color: '#FBBF24', bg: '#F59E0B15' },
  { status: 'not_going' as const, label: 'Gelemiyorum', color: '#F87171', bg: '#EF444415' },
];

export const MemberMatchDetailsScreen: React.FC<Props> = ({
  reservationId, currentUserId, reservations, memberContributions,
  captainPayoutProfiles, matchRsvps, onBack, onSetRSVP, onSubmitProof,
}) => {
  const res = reservations.find(r => r.id === reservationId);
  const contrib = memberContributions.find(c => c.reservationId === reservationId && c.memberUserId === currentUserId);
  const myRsvp = matchRsvps.find(r => r.reservationId === reservationId && r.userId === currentUserId);
  const [proofUrl, setProofUrl] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [proofSent, setProofSent] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  if (!res) return (
    <SafeAreaView style={s.container}>
      <Text style={{ color: '#64748B', textAlign: 'center', marginTop: 40 }}>Maç bulunamadı.</Text>
    </SafeAreaView>
  );

  // Find captain payout profile from teamId... simplified
  const captainProfile = captainPayoutProfiles[0];
  const eftRef = `TEAM-${res.teamId ?? 'T'}-RES-${res.id}-U${currentUserId.slice(-3).toUpperCase()}`;
  const remaining = contrib ? contrib.expectedAmount - contrib.paidAmount : 0;

  const copy = async (text: string, key: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const CopyBtn: React.FC<{ text: string; k: string }> = ({ text, k }) => (
    <TouchableOpacity onPress={() => copy(text, k)} style={[s.copyBtn, copiedKey === k && s.copyBtnActive]}>
      <Text style={[s.copyBtnText, copiedKey === k && { color: '#34D399' }]}>
        {copiedKey === k ? '✓ Kopyalandı' : '📋 Kopyala'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={onBack}><Text style={s.back}>← Geri</Text></TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.title} numberOfLines={1}>{res.venueName}</Text>
          <Text style={s.subtitle}>{res.date} · {res.startTime}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* RSVP */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Katılım Durumun</Text>
          <View style={s.rsvpRow}>
            {RSVP_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.status}
                onPress={() => onSetRSVP(reservationId, opt.status)}
                style={[s.rsvpBtn, { backgroundColor: opt.bg }, myRsvp?.status === opt.status && { borderColor: opt.color, borderWidth: 2 }]}
              >
                <Text style={[s.rsvpBtnText, { color: opt.color }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment */}
        {contrib && captainProfile && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Ödeme Bilgileri</Text>

            {/* Progress */}
            <View style={s.progressRow}>
              <Text style={s.progressLabel}>Ödendi: {contrib.paidAmount}₺ / {contrib.expectedAmount}₺</Text>
              <View style={s.progressBg}>
                <View style={[s.progressFill, {
                  width: `${Math.round((contrib.paidAmount / contrib.expectedAmount) * 100)}%` as any,
                  backgroundColor: contrib.status === 'paid' ? '#10B981' : contrib.status === 'partial' ? '#F59E0B' : '#EF4444',
                }]} />
              </View>
            </View>

            {remaining > 0 && (
              <>
                {captainProfile.iban && (
                  <View style={s.infoRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.infoLabel}>IBAN</Text>
                      <Text style={s.infoValue}>{captainProfile.iban}</Text>
                      <Text style={s.infoSub}>{captainProfile.accountName} · {captainProfile.bankName}</Text>
                    </View>
                    <CopyBtn text={captainProfile.iban} k="iban" />
                  </View>
                )}

                <View style={s.infoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.infoLabel}>EFT Açıklaması</Text>
                    <Text style={s.infoValueMono}>{eftRef}</Text>
                  </View>
                  <CopyBtn text={eftRef} k="eft" />
                </View>

                <TouchableOpacity
                  onPress={() => copy(`IBAN: ${captainProfile.iban}\nAçıklama: ${eftRef}\nTutar: ${remaining}₺`, 'all')}
                  style={[s.allCopyBtn, copiedKey === 'all' && s.allCopyBtnActive]}
                >
                  <Text style={[s.allCopyBtnText, copiedKey === 'all' && { color: '#34D399' }]}>
                    {copiedKey === 'all' ? '✓ Kopyalandı!' : '📋 Hepsini Kopyala (IBAN + Açıklama + Tutar)'}
                  </Text>
                </TouchableOpacity>

                {/* Proof */}
                {!proofSent ? (
                  <View>
                    <Text style={[s.cardTitle, { marginTop: 12 }]}>Dekont Linki Gönder</Text>
                    <TextInput
                      value={proofUrl}
                      onChangeText={setProofUrl}
                      placeholder="https://drive.google.com/…"
                      placeholderTextColor="#334155"
                      style={s.textInput}
                    />
                    <TextInput
                      value={proofNote}
                      onChangeText={setProofNote}
                      placeholder="Not (opsiyonel)"
                      placeholderTextColor="#334155"
                      style={[s.textInput, { marginTop: 8 }]}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        if (!proofUrl.trim()) return;
                        onSubmitProof(reservationId, proofUrl, proofNote);
                        setProofSent(true);
                      }}
                      disabled={!proofUrl.trim()}
                      style={[s.sendBtn, !proofUrl.trim() && s.sendBtnDisabled]}
                    >
                      <Text style={s.sendBtnText}>Kaptana Gönder →</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={s.successBox}>
                    <Text style={s.successText}>✅ Dekont kaptana iletildi</Text>
                  </View>
                )}
              </>
            )}

            {contrib.status === 'paid' && (
              <View style={s.successBox}>
                <Text style={s.successText}>✅ Ödemen tamamlandı</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  back: { color: '#64748B', fontWeight: 'bold' },
  title: { color: '#fff', fontWeight: '900', fontSize: 16 },
  subtitle: { color: '#64748B', fontSize: 12 },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTitle: { color: '#94A3B8', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },
  rsvpRow: { flexDirection: 'row', gap: 8 },
  rsvpBtn: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  rsvpBtnText: { fontWeight: '900', fontSize: 12 },
  progressRow: { marginBottom: 12 },
  progressLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 6 },
  progressBg: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 12, padding: 12, marginBottom: 8 },
  infoLabel: { color: '#64748B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  infoValueMono: { color: '#fff', fontWeight: 'bold', fontSize: 12, fontFamily: 'monospace' },
  infoSub: { color: '#64748B', fontSize: 10, marginTop: 1 },
  copyBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#334155', borderRadius: 8 },
  copyBtnActive: { backgroundColor: '#10B98120' },
  copyBtnText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  allCopyBtn: { backgroundColor: '#FACC1510', borderColor: '#FACC1520', borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  allCopyBtnActive: { backgroundColor: '#10B98115' },
  allCopyBtnText: { color: '#FACC15', fontWeight: 'bold', fontSize: 13 },
  textInput: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 12, color: '#fff', fontSize: 13 },
  sendBtn: { backgroundColor: '#FACC15', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#0F172A', fontWeight: '900', fontSize: 14 },
  successBox: { backgroundColor: '#10B98115', borderRadius: 12, padding: 14, alignItems: 'center' },
  successText: { color: '#34D399', fontWeight: 'bold', fontSize: 14 },
});
