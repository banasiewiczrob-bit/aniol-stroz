import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';

const DRAFT_KEY = '@trigger_list_draft_v1';
const ITEMS_KEY = '@trigger_list_items_v1';
const CATEGORY_KEY = '@trigger_list_category_v1';
const ACCENT = '#C6D7FF';
const ACCENT_BG = 'rgba(198,215,255,0.22)';
const ACCENT_BORDER = 'rgba(198,215,255,0.55)';
const SUB = 'rgba(233,239,255,0.88)';

const QUICK_CATEGORIES = ['Wieczór', 'Samotność', 'Zmęczenie', 'Konflikt', 'Miejsce', 'Telefon'];

type TriggerItem = {
  id: string;
  text: string;
  category: string | null;
  createdAt: string;
};

function parseItems(raw: string | null): TriggerItem[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const entry = item as Partial<TriggerItem>;
        if (typeof entry.id !== 'string' || typeof entry.text !== 'string' || typeof entry.createdAt !== 'string') {
          return [];
        }
        return [
          {
            id: entry.id,
            text: entry.text,
            category: typeof entry.category === 'string' && entry.category.trim().length > 0 ? entry.category : null,
            createdAt: entry.createdAt,
          },
        ];
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function formatSavedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pl-PL');
}

function getCountLabel(count: number) {
  if (count === 1) return '1 zapisany wyzwalacz';

  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return `${count} zapisane wyzwalacze`;
  }

  return `${count} zapisanych wyzwalaczy`;
}

export default function ListaWyzwalaczyScreen() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [items, setItems] = useState<TriggerItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [feedback, setFeedback] = useState('');

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef('');
  const lastSavedCategory = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const [savedDraft, savedItems, savedCategory] = await Promise.all([
          AsyncStorage.getItem(DRAFT_KEY),
          AsyncStorage.getItem(ITEMS_KEY),
          AsyncStorage.getItem(CATEGORY_KEY),
        ]);

        if (!active) return;

        if (savedDraft != null) {
          setText(savedDraft);
          lastSaved.current = savedDraft;
        }
        if (savedCategory && QUICK_CATEGORIES.includes(savedCategory)) {
          setSelectedCategory(savedCategory);
          lastSavedCategory.current = savedCategory;
        }
        setItems(parseItems(savedItems));
      } finally {
        if (active) setLoaded(true);
      }
    })();

    return () => {
      active = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const showFeedback = (message: string) => {
    setFeedback(message);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      setFeedback('');
    }, 2800);
  };

  const saveDraftNow = async (value: string, category: string | null) => {
    if (!loaded) return;
    if (value === lastSaved.current && category === lastSavedCategory.current) return;

    try {
      await Promise.all([
        AsyncStorage.setItem(DRAFT_KEY, value),
        category ? AsyncStorage.setItem(CATEGORY_KEY, category) : AsyncStorage.removeItem(CATEGORY_KEY),
      ]);
      lastSaved.current = value;
      lastSavedCategory.current = category;
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    if (!loaded) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveDraftNow(text, selectedCategory);
    }, 300);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [loaded, selectedCategory, text]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      void saveDraftNow(text, selectedCategory);
    });
    return () => sub.remove();
  }, [loaded, selectedCategory, text]);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert('Brak treści', 'Najpierw zapisz jedną konkretną sytuację albo stan, który chcesz rozpoznawać wcześniej.');
      return;
    }

    const nextItem: TriggerItem = {
      id: `${Date.now()}`,
      text: trimmed,
      category: selectedCategory,
      createdAt: new Date().toISOString(),
    };
    const previousItems = items;
    const previousText = text;
    const previousCategory = selectedCategory;
    const nextItems = [nextItem, ...items];

    if (saveTimer.current) clearTimeout(saveTimer.current);

    setItems(nextItems);
    setText('');
    setSelectedCategory(null);

    try {
      await Promise.all([
        AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(nextItems)),
        AsyncStorage.setItem(DRAFT_KEY, ''),
        AsyncStorage.removeItem(CATEGORY_KEY),
      ]);
      lastSaved.current = '';
      lastSavedCategory.current = null;
      showFeedback(
        nextItems.length === 1
          ? 'Zapisane. To jest początek Twojej prywatnej listy ostrzegawczej.'
          : `Zapisane. Masz już ${getCountLabel(nextItems.length)}.`,
      );
    } catch {
      setItems(previousItems);
      setText(previousText);
      setSelectedCategory(previousCategory);
      Alert.alert('Błąd zapisu', 'Nie udało się zapisać tej pozycji. Spróbuj ponownie.');
    }
  };

  const handleDelete = (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;

    Alert.alert('Usunąć wpis?', 'Ta pozycja zniknie z Twojej listy wyzwalaczy.', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const previousItems = items;
            const nextItems = items.filter((item) => item.id !== id);
            setItems(nextItems);

            try {
              await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(nextItems));
              showFeedback('Usunięto wpis z Twojej listy.');
            } catch {
              setItems(previousItems);
              Alert.alert('Błąd zapisu', 'Nie udało się usunąć wpisu. Spróbuj ponownie.');
            }
          })();
        },
      },
    ]);
  };

  const summaryText =
    items.length === 0
      ? 'Na początek zapisz 2-3 rzeczy, po których zwykle czujesz, że ryzyko rośnie.'
      : `Masz już ${getCountLabel(items.length)}. Dzięki temu łatwiej zauważysz sygnał zanim Cię zaleje.`;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <BackButton />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(64, insets.bottom + 40) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bgOrbA} />
        <View style={styles.bgOrbB} />

        <Text style={styles.title}>Lista wyzwalaczy</Text>
        <Text style={styles.subtitle}>
          Zapisuj sytuacje, miejsca i stany, po których zwykle rośnie napięcie albo chęć ucieczki.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Po co to dla Ciebie</Text>
          <Text style={styles.infoText}>
            Kiedy wyzwalacz jest nazwany wcześniej, łatwiej nie dać się zaskoczyć i szybciej wrócić do planu albo wsparcia.
          </Text>
          <Text style={styles.infoText}>{summaryText}</Text>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.cardAccent} />
          <Text style={styles.sectionTitle}>Dodaj nowy wyzwalacz</Text>
          <Text style={styles.sectionText}>
            Wpisz konkretnie, co zwykle podnosi ryzyko. Na przykład: wieczór sam w domu, zmęczenie po pracy, kłótnia, scrollowanie.
          </Text>

          <View style={styles.chipsRow}>
            {QUICK_CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <Pressable
                  key={category}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedCategory((prev) => (prev === category ? null : category))}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{category}</Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={text}
            onChangeText={setText}
            onBlur={() => void saveDraftNow(text, selectedCategory)}
            placeholder="Np. samotny powrót do domu, telefon od tej osoby, nuda po 21:00"
            placeholderTextColor="rgba(255,255,255,0.45)"
            multiline
            textAlignVertical="top"
            style={styles.input}
          />

          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

          <Pressable style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>Dodaj do listy</Text>
          </Pressable>
        </View>

        <View style={styles.archiveCard}>
          <Text style={styles.archiveTitle}>Twoja lista ({items.length})</Text>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>Na razie nic tu nie ma. Zacznij od pierwszej konkretnej rzeczy, która zwykle poprzedza gorszy moment.</Text>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemMeta}>
                    {item.category ? (
                      <View style={styles.itemCategory}>
                        <Text style={styles.itemCategoryText}>{item.category}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.itemDate}>{formatSavedDate(item.createdAt)}</Text>
                  </View>
                  <Pressable style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                    <Text style={styles.deleteButtonText}>Usuń</Text>
                  </Pressable>
                </View>
                <Text style={styles.itemText}>{item.text}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#061A2C' },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  bgOrbA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(198,215,255,0.12)',
    top: -70,
    right: -88,
  },
  bgOrbB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,199,217,0.09)',
    bottom: 110,
    left: -80,
  },
  title: {
    color: 'white',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 8,
  },
  subtitle: {
    color: SUB,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 14,
  },
  infoCard: {
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoTitle: {
    color: 'white',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoText: {
    color: 'rgba(232,245,255,0.82)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  inputCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    backgroundColor: ACCENT_BG,
    padding: 14,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  cardAccent: {
    width: 46,
    height: 4,
    borderRadius: 999,
    backgroundColor: ACCENT,
    marginBottom: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionText: {
    color: SUB,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(198,215,255,0.35)',
    backgroundColor: 'rgba(7,24,38,0.34)',
  },
  chipActive: {
    borderColor: 'rgba(226,244,255,0.95)',
    backgroundColor: 'rgba(198,215,255,0.22)',
  },
  chipText: {
    color: 'rgba(240,248,255,0.86)',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: 'white',
  },
  input: {
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(198,215,255,0.35)',
    backgroundColor: 'rgba(7,24,38,0.44)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: 'white',
    fontSize: 17,
    lineHeight: 24,
  },
  feedback: {
    color: '#D9EAFF',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(198,215,255,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(198,215,255,0.55)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  archiveCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(198,215,255,0.25)',
    backgroundColor: 'rgba(12,38,62,0.78)',
    padding: 14,
  },
  archiveTitle: {
    color: 'white',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyText: {
    color: SUB,
    fontSize: 15,
    lineHeight: 22,
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(198,215,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 12,
    marginTop: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemCategory: {
    borderRadius: 999,
    backgroundColor: 'rgba(198,215,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(198,215,255,0.42)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  itemCategoryText: {
    color: '#E4F0FF',
    fontSize: 12,
    fontWeight: '700',
  },
  itemDate: {
    color: 'rgba(232,245,255,0.62)',
    fontSize: 12,
    lineHeight: 16,
  },
  itemText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  deleteButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,167,190,0.45)',
    backgroundColor: 'rgba(255,167,190,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: '#FFD5E0',
    fontSize: 14,
    fontWeight: '700',
  },
});
