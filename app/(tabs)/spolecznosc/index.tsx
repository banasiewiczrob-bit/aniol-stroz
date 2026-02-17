import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import {
  listCommunityGroups,
  listMainRoomMessages,
  listMainRoomParticipants,
  listThreadsByGroup,
  sendMainRoomMessage,
  type MainRoomMessage,
  type MainRoomParticipant,
} from '@/hooks/useCommunityForum';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type GroupWithStats = {
  id: string;
  title: string;
  description: string;
  threadCount: number;
};

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

export default function SpolecznoscScreen() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [groups, setGroups] = useState<GroupWithStats[]>([]);
  const [participants, setParticipants] = useState<MainRoomParticipant[]>([]);
  const [messages, setMessages] = useState<MainRoomMessage[]>([]);
  const [authorAlias, setAuthorAlias] = useState('');
  const [messageBody, setMessageBody] = useState('');

  const normalizedAlias = useMemo(() => authorAlias.trim().toLowerCase(), [authorAlias]);

  const load = useCallback(async () => {
    const [baseGroups, roomMessages, roomParticipants] = await Promise.all([
      listCommunityGroups(),
      listMainRoomMessages(),
      listMainRoomParticipants(),
    ]);

    const threadsPerGroup = await Promise.all(baseGroups.map((group) => listThreadsByGroup(group.id)));
    const nextGroups = baseGroups.map((group, index) => ({
      ...group,
      threadCount: threadsPerGroup[index].length,
    }));

    setGroups(nextGroups);
    setMessages(roomMessages);
    setParticipants(roomParticipants);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    };

    void run();
    const intervalId = setInterval(() => {
      void load();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [load]);

  const onSend = async () => {
    const body = messageBody.trim();
    if (!body) {
      Alert.alert('Brak wiadomości', 'Wpisz treść wiadomości.');
      return;
    }

    const safeAlias = authorAlias.trim() || 'Anonim';
    setBusy(true);
    try {
      await sendMainRoomMessage({
        authorAlias: safeAlias,
        body,
      });
      setMessageBody('');
      await load();
    } catch (e) {
      console.error('Błąd wysyłania wiadomości:', e);
      Alert.alert('Błąd', 'Nie udało się wysłać wiadomości.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Społeczność</Text>
        <Text style={styles.subtitle}>Pokój główny: szybka rozmowa na żywo i widoczni uczestnicy.</Text>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>Pisz pod pseudonimem. Bez danych wrażliwych, numerów telefonów i adresów.</Text>
        </View>

        <Text style={styles.sectionTitle}>Uczestnicy teraz</Text>
        {participants.length === 0 ? <Text style={styles.emptyText}>Brak aktywnych uczestników.</Text> : null}
        <View style={styles.participantsWrap}>
          {participants.map((participant) => (
            <View key={participant.alias} style={styles.participantChip}>
              <View style={styles.participantDot} />
              <Text style={styles.participantText}>{participant.alias}</Text>
            </View>
          ))}
        </View>

        <View style={styles.roomCard}>
          <Text style={styles.roomTitle}>Pokój główny</Text>
          {loading ? <Text style={styles.loading}>Ładowanie rozmowy...</Text> : null}

          {messages.map((message) => {
            const isMine = normalizedAlias.length > 0 && message.authorAlias.toLowerCase() === normalizedAlias;
            return (
              <View key={message.id} style={[styles.messageRow, isMine && styles.messageRowMine]}>
                <View style={[styles.messageBubble, isMine && styles.messageBubbleMine]}>
                  <Text style={styles.messageAuthor}>{message.authorAlias}</Text>
                  <Text style={styles.messageBody}>{message.body}</Text>
                  <Text style={styles.messageTime}>{formatTime(message.createdAt)}</Text>
                </View>
              </View>
            );
          })}

          {messages.length === 0 && !loading ? <Text style={styles.emptyText}>Brak wiadomości. Napisz pierwszą.</Text> : null}
        </View>

        <View style={styles.composeCard}>
          <Text style={styles.sectionTitle}>Napisz wiadomość</Text>
          <TextInput
            style={styles.input}
            value={authorAlias}
            onChangeText={setAuthorAlias}
            placeholder="Pseudonim (np. SpokojnyKrok)"
            placeholderTextColor="rgba(255,255,255,0.45)"
            maxLength={32}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={messageBody}
            onChangeText={setMessageBody}
            placeholder="Co chcesz napisać grupie?"
            placeholderTextColor="rgba(255,255,255,0.45)"
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
          <Pressable style={[styles.primaryBtn, busy && styles.disabled]} disabled={busy} onPress={onSend}>
            <Text style={styles.primaryBtnText}>{busy ? 'Wysyłanie...' : 'Wyślij'}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Grupy tematyczne</Text>
        {groups.map((group) => (
          <Pressable key={group.id} style={styles.groupCard} onPress={() => router.push(`/spolecznosc/${group.id}` as any)}>
            <View style={styles.groupCardHead}>
              <Text style={styles.groupCardTitle}>{group.title}</Text>
              <Text style={styles.countBadge}>{group.threadCount}</Text>
            </View>
            <Text style={styles.groupCardSubtitle}>{group.description}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071826' },
  content: { padding: 18, paddingTop: 18, paddingBottom: 36 },
  title: { color: 'white', fontSize: 36, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 17, lineHeight: 25, marginBottom: 14 },
  notice: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.26)',
    backgroundColor: 'rgba(120,200,255,0.1)',
    padding: 12,
    marginBottom: 14,
  },
  noticeText: { color: '#D8F1FF', fontSize: 14, lineHeight: 20 },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  participantsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.34)',
    backgroundColor: 'rgba(120,200,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  participantDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#86E4AE',
  },
  participantText: { color: '#D8F1FF', fontSize: 13, fontWeight: '700' },
  roomCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    marginBottom: 14,
  },
  roomTitle: { color: 'white', fontSize: 19, fontWeight: '700', marginBottom: 10 },
  loading: { color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: 10 },
  messageRow: { marginBottom: 8, alignItems: 'flex-start' },
  messageRowMine: { alignItems: 'flex-end' },
  messageBubble: {
    width: '92%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.22)',
    backgroundColor: 'rgba(7,24,38,0.58)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  messageBubbleMine: {
    borderColor: 'rgba(120,200,255,0.45)',
    backgroundColor: 'rgba(120,200,255,0.16)',
  },
  messageAuthor: { color: '#D8F1FF', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  messageBody: { color: 'white', fontSize: 15, lineHeight: 22, marginBottom: 5 },
  messageTime: { color: 'rgba(184,223,255,0.85)', fontSize: 11, fontWeight: '600' },
  composeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    marginBottom: 14,
  },
  input: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.22)',
    backgroundColor: 'rgba(7,24,38,0.58)',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  textArea: { minHeight: 96 },
  primaryBtn: {
    borderRadius: 11,
    backgroundColor: '#3B5998',
    alignItems: 'center',
    paddingVertical: 11,
  },
  primaryBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  emptyText: { color: 'rgba(255,255,255,0.68)', fontSize: 14, lineHeight: 21, marginBottom: 10 },
  groupCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    marginBottom: 10,
  },
  groupCardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 5 },
  groupCardTitle: { color: 'white', fontSize: 22, fontWeight: '700' },
  countBadge: {
    color: '#D8F1FF',
    fontSize: 13,
    fontWeight: '700',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.36)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: 'rgba(120,200,255,0.14)',
    overflow: 'hidden',
  },
  groupCardSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 22 },
});
