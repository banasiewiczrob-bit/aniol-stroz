import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import {
  createCommunityThread,
  getCommunityGroup,
  listThreadsByGroup,
  type CommunityThread,
} from '@/hooks/useCommunityForum';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function SpolecznoscGroupScreen() {
  const params = useLocalSearchParams<{ groupId?: string }>();
  const groupId = typeof params.groupId === 'string' ? params.groupId : '';

  const [loading, setLoading] = useState(true);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [busy, setBusy] = useState(false);

  const [authorAlias, setAuthorAlias] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const [group, groupThreads] = await Promise.all([getCommunityGroup(groupId), listThreadsByGroup(groupId)]);

      if (!group) {
        Alert.alert('Brak grupy', 'Nie znaleziono tej grupy społeczności.');
        router.back();
        return;
      }

      setGroupTitle(group.title);
      setGroupDescription(group.description);
      setThreads(groupThreads);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async () => {
    const safeAlias = authorAlias.trim() || 'Anonim';
    if (!title.trim() || !body.trim()) {
      Alert.alert('Brak treści', 'Uzupełnij tytuł i treść wątku.');
      return;
    }

    setBusy(true);
    try {
      await createCommunityThread({
        groupId,
        title,
        body,
        authorAlias: safeAlias,
      });
      setTitle('');
      setBody('');
      await load();
    } catch (e) {
      console.error('Błąd tworzenia wątku:', e);
      Alert.alert('Błąd', 'Nie udało się dodać wątku.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{groupTitle || 'Grupa'}</Text>
        <Text style={styles.subtitle}>{groupDescription}</Text>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Nowy wątek</Text>
          <TextInput
            style={styles.input}
            value={authorAlias}
            onChangeText={setAuthorAlias}
            placeholder="Pseudonim (opcjonalnie)"
            placeholderTextColor="rgba(255,255,255,0.45)"
            maxLength={32}
          />
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Tytuł wątku"
            placeholderTextColor="rgba(255,255,255,0.45)"
            maxLength={120}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={body}
            onChangeText={setBody}
            placeholder="Opisz temat..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            multiline
            textAlignVertical="top"
            maxLength={1200}
          />
          <Pressable style={[styles.primaryBtn, busy && styles.disabled]} disabled={busy} onPress={onCreate}>
            <Text style={styles.primaryBtnText}>{busy ? 'Dodawanie...' : 'Dodaj wątek'}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Wątki</Text>
        {loading ? <Text style={styles.loading}>Ładowanie...</Text> : null}
        {!loading && threads.length === 0 ? (
          <Text style={styles.empty}>Brak wątków. Zacznij rozmowę jako pierwszy.</Text>
        ) : null}

        {threads.map((thread) => (
          <Pressable key={thread.id} style={styles.threadCard} onPress={() => router.push(`/spolecznosc/watek/${thread.id}` as any)}>
            <Text style={styles.threadTitle}>{thread.title}</Text>
            <Text style={styles.threadBody} numberOfLines={2}>
              {thread.body}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{thread.authorAlias}</Text>
              <Text style={styles.metaText}>{thread.commentCount} odpowiedzi</Text>
              <Text style={styles.metaText}>{formatDate(thread.lastActivityAt)}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071826' },
  content: { padding: 18, paddingTop: 18, paddingBottom: 36 },
  title: { color: 'white', fontSize: 32, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 16, lineHeight: 23, marginBottom: 14 },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  formCard: {
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
  textArea: { minHeight: 100 },
  primaryBtn: {
    borderRadius: 11,
    backgroundColor: '#3B5998',
    alignItems: 'center',
    paddingVertical: 11,
  },
  primaryBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  loading: { color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: 10 },
  empty: { color: 'rgba(255,255,255,0.68)', fontSize: 15, lineHeight: 22, marginBottom: 10 },
  threadCard: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    marginBottom: 10,
  },
  threadTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  threadBody: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 21, marginBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  metaText: { color: 'rgba(184,223,255,0.85)', fontSize: 12, fontWeight: '600' },
});
