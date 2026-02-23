/**
 * TeamChatScreen – Takım grup sohbeti (Firestore realtime)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type ChatNavProp = StackNavigationProp<RootStackParamList, 'TeamChat'>;

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  createdAt: Date;
}

export default function TeamChatScreen() {
  const navigation = useNavigation<ChatNavProp>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const teamId = user?.teamId;

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }
    const unsub = firestore()
      .collection('team_chat')
      .where('teamId', '==', teamId)
      .orderBy('createdAt', 'desc')
      .limit(80)
      .onSnapshot((snap) => {
        const msgs = snap.docs.map((doc) => {
          const d = doc.data() || {};
          const ts = (d.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date();
          return {
            id: doc.id,
            text: (d.text as string) ?? '',
            senderId: (d.senderId as string) ?? '',
            senderName: (d.senderName as string) ?? 'Oyuncu',
            senderAvatar: d.senderAvatar as string | undefined,
            createdAt: ts,
          };
        });
        setMessages(msgs);
        setLoading(false);
      }, () => setLoading(false));
    return () => unsub();
  }, [teamId]);

  const sendMessage = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !teamId || sending) return;
    setSending(true);
    setText('');
    try {
      await firestore().collection('team_chat').add({
        teamId,
        text: trimmed,
        senderId: user?.id ?? '',
        senderName: user?.name ?? 'Oyuncu',
        senderAvatar: user?.avatar ?? null,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.warn('Send error', e);
    } finally {
      setSending(false);
    }
  }, [text, teamId, sending, user]);

  function formatTime(d: Date) {
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(d: Date) {
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Bugün';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Dün';
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  }

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMe = item.senderId === user?.id;
    const prev = messages[index + 1];
    const showDate = !prev || formatDate(prev.createdAt) !== formatDate(item.createdAt);
    const showAvatar = !isMe && (index === 0 || messages[index - 1]?.senderId !== item.senderId);

    return (
      <>
        {showDate && (
          <View style={styles.dateSep}>
            <Text style={styles.dateSepText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
          {!isMe && (
            <View style={styles.avatarWrap}>
              {showAvatar ? (
                <Image
                  source={{ uri: item.senderAvatar || `https://i.pravatar.cc/150?u=${item.senderId}` }}
                  style={styles.msgAvatar}
                />
              ) : (
                <View style={styles.msgAvatarPlaceholder} />
              )}
            </View>
          )}
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            {!isMe && showAvatar && (
              <Text style={styles.senderName}>{item.senderName}</Text>
            )}
            <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
            <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </>
    );
  };

  if (!teamId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Takım Chat</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.noTeam}>
          <Icon name="forum-outline" size={64} color={colors.text.disabled} />
          <Text style={styles.noTeamText}>Sohbet için takıma katılman gerekiyor</Text>
          <TouchableOpacity style={styles.joinBtn} onPress={() => navigation.navigate('JoinTeam')}>
            <Text style={styles.joinBtnText}>Takıma Katıl</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Takım Sohbeti</Text>
          <View style={styles.onlineDot} />
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Team')}>
          <Icon name="account-group" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={styles.msgList}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Icon name="chat-outline" size={48} color={colors.text.disabled} />
              <Text style={styles.emptyText}>Henüz mesaj yok. İlk mesajı sen at!</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Mesaj yaz..."
          placeholderTextColor={colors.text.disabled}
          multiline
          maxLength={500}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  headerTitle: { ...typography.h3, color: colors.text.primary, fontSize: 17 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  msgList: { padding: spacing.md, paddingBottom: 8 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  emptyText: { marginTop: spacing.md, color: colors.text.secondary, fontSize: typography.fontSize.sm, textAlign: 'center' },
  dateSep: { alignItems: 'center', marginVertical: spacing.md },
  dateSepText: { fontSize: typography.fontSize.xs, color: colors.text.disabled, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.full },
  msgRow: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end' },
  msgRowMe: { flexDirection: 'row-reverse' },
  avatarWrap: { width: 32, marginRight: 8 },
  msgAvatar: { width: 32, height: 32, borderRadius: 16 },
  msgAvatarPlaceholder: { width: 32 },
  bubble: {
    maxWidth: '78%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  senderName: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.primary, marginBottom: 4 },
  msgText: { fontSize: typography.fontSize.md, color: colors.text.primary, lineHeight: 20 },
  msgTextMe: { color: '#fff' },
  msgTime: { fontSize: 10, color: colors.text.disabled, marginTop: 4, textAlign: 'right' },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    paddingBottom: Platform.OS === 'ios' ? 28 : spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    maxHeight: 100,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  noTeam: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  noTeamText: { marginTop: spacing.md, color: colors.text.secondary, textAlign: 'center', fontSize: typography.fontSize.md },
  joinBtn: { marginTop: spacing.xl, backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  joinBtnText: { color: '#fff', fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },
});
