import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import {
  createCommunityComment,
  getThreadById,
  listCommentsByThread,
  type CommunityComment,
  type CommunityThread,
} from '@/hooks/useCommunityForum';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SpolecznoscThreadScreen() {
  const params = useLocalSearchParams<{ threadId?: string }>();
  const threadId = typeof params.threadId === 'string' ? params.threadId : '';

  const [loading, setLoading] = useState(true);
  const [thread, setThread] = useState<CommunityThread | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [busy, setBusy] = useState(false);

  const [authorAlias, setAuthorAlias] = useState('');
  const [body, setBody] = useState('');

  const load = useCallback(async () => {
    if (!threadId) return;

    setLoading(true);
    try {
      const [threadData, threadComments] = await Promise.all([getThreadById(threadId), listCommentsByThread(threadId)]);
      if (!threadData) {
        Alert.alert('Brak wątku', 'Nie znaleziono wskazanego wątku.');
        router.back();
        return;
      }

      setThread(threadData);
      setComments(threadComments);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreateComment = async () => {
    const safeAlias = authorAlias.trim() || 'Anonim';
    if (!body.trim()) {
      Alert.alert('Brak treści', 'Wpisz treść odpowiedzi.');
      return;
    }

    setBusy(true);
    try {
      await createCommunityComment({
        threadId,
        body,
        authorAlias: safeAlias,
      });
      setBody('');
      await load();
    } catch (e) {
      console.error('Błąd dodawania komentarza:', e);
      Alert.alert('Błąd', 'Nie udało się dodać odpowiedzi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {thread ? (
          <View style={styles.threadCard}>
            <Text style={styles.threadTitle}>{thread.title}</Text>
            <Text style={styles.threadBody}>{thread.body}</Text>
            <Text style={styles.threadMeta}>
              Autor: {thread.authorAlias} | {formatDateTime(thread.createdAt)}
            </Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Dodaj odpowiedź</Text>
          <TextInput
            style={styles.input}
            value={authorAlias}
            onChangeText={setAuthorAlias}
            placeholder="Pseudonim (opcjonalnie)"
            placeholderTextColor="rgba(255,255,255,0.45)"
            maxLength={32}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={body}
            onChangeText={setBody}
            placeholder="Napisz odpowiedź..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
          <Pressable style={[styles.primaryBtn, busy && styles.disabled]} disabled={busy} onPress={onCreateComment}>
            <Text style={styles.primaryBtnText}>{busy ? 'Dodawanie...' : 'Wyślij odpowiedź'}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Odpowiedzi</Text>
        {loading ? <Text style={styles.loading}>Ładowanie...</Text> : null}
        {!loading && comments.length === 0 ? <Text style={styles.empty}>Brak odpowiedzi. Napisz pierwszą.</Text> : null}

        {comments.map((comment) => (
          <View key={comment.id} style={styles.commentCard}>
            <Text style={styles.commentBody}>{comment.body}</Text>
            <Text style={styles.commentMeta}>
              {comment.authorAlias} | {formatDateTime(comment.createdAt)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071826' },
  content: { padding: 18, paddingTop: 18, paddingBottom: 36 },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  threadCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 13,
    marginBottom: 12,
  },
  threadTitle: { color: 'white', fontSize: 21, fontWeight: '700', marginBottom: 5 },
  threadBody: { color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 23, marginBottom: 8 },
  threadMeta: { color: 'rgba(184,223,255,0.85)', fontSize: 12, fontWeight: '600' },
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
  textArea: { minHeight: 96 },
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
  commentCard: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    marginBottom: 10,
  },
  commentBody: { color: 'rgba(255,255,255,0.82)', fontSize: 15, lineHeight: 22, marginBottom: 7 },
  commentMeta: { color: 'rgba(184,223,255,0.85)', fontSize: 12, fontWeight: '600' },
});
