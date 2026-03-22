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
const DESCRIPTION_DRAFT_KEY = '@trigger_list_description_draft_v1';
const ITEMS_KEY = '@trigger_list_items_v1';
const KIND_KEY = '@trigger_list_kind_v2';
const LEGACY_CATEGORY_KEY = '@trigger_list_category_v1';
const ACCENT = '#C6D7FF';
const ACCENT_BG = 'rgba(198,215,255,0.22)';
const ACCENT_BORDER = 'rgba(198,215,255,0.55)';
const SUB = 'rgba(233,239,255,0.88)';
const ARCHIVE_SCROLL_TOP_OFFSET = 72;

type TriggerKind = 'internal' | 'external';

type TriggerItem = {
  id: string;
  triggerName: string;
  description: string;
  kind: TriggerKind;
  createdAt: string;
};

function isTriggerKind(value: unknown): value is TriggerKind {
  return value === 'internal' || value === 'external';
}

function normalizeComparableText(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pl-PL');
}

function inferLegacyKind(rawCategory: unknown, rawText: unknown): TriggerKind {
  const source = [rawCategory, rawText]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pl-PL');

  if (
    source.includes('samotn') ||
    source.includes('zmeczen') ||
    source.includes('glod') ||
    source.includes('lek') ||
    source.includes('nuda') ||
    source.includes('wstyd') ||
    source.includes('zlosc')
  ) {
    return 'internal';
  }

  return 'external';
}

function parseItems(raw: string | null): TriggerItem[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const entry = item as Partial<TriggerItem>;
        const legacyText = typeof (entry as { text?: unknown }).text === 'string' ? (entry as { text: string }).text : '';
        const triggerName =
          typeof entry.triggerName === 'string' && entry.triggerName.trim().length > 0
            ? entry.triggerName
            : legacyText;

        if (
          typeof entry.id !== 'string' ||
          triggerName.trim().length === 0 ||
          typeof entry.createdAt !== 'string'
        ) {
          return [];
        }
        return [
          {
            id: entry.id,
            triggerName,
            description: typeof entry.description === 'string' ? entry.description.trim() : '',
            kind: isTriggerKind((entry as { kind?: unknown }).kind)
              ? (entry as { kind: TriggerKind }).kind
              : inferLegacyKind((entry as { category?: unknown }).category, triggerName),
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

function getKindLabel(kind: TriggerKind) {
  return kind === 'internal' ? 'Wewnętrzne' : 'Zewnętrzne';
}

export default function ListaWyzwalaczyScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView | null>(null);
  const archiveCardOffsetRef = useRef(0);
  const sectionOffsetsRef = useRef<Record<TriggerKind, number>>({
    internal: 0,
    external: 0,
  });
  const pendingScrollKindRef = useRef<TriggerKind | null>(null);
  const [triggerName, setTriggerName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedKind, setSelectedKind] = useState<TriggerKind | null>(null);
  const [items, setItems] = useState<TriggerItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [externalExpanded, setExternalExpanded] = useState(false);
  const [isIntroExpanded, setIsIntroExpanded] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedName = useRef('');
  const lastSavedDescription = useRef('');
  const lastSavedKind = useRef<TriggerKind | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const [savedDraft, savedDescriptionDraft, savedItems, savedKind, savedLegacyCategory] = await Promise.all([
          AsyncStorage.getItem(DRAFT_KEY),
          AsyncStorage.getItem(DESCRIPTION_DRAFT_KEY),
          AsyncStorage.getItem(ITEMS_KEY),
          AsyncStorage.getItem(KIND_KEY),
          AsyncStorage.getItem(LEGACY_CATEGORY_KEY),
        ]);

        if (!active) return;

        if (savedDraft != null) {
          setTriggerName(savedDraft);
          lastSavedName.current = savedDraft;
        }
        if (savedDescriptionDraft != null) {
          setDescription(savedDescriptionDraft);
          lastSavedDescription.current = savedDescriptionDraft;
        }
        if (isTriggerKind(savedKind)) {
          setSelectedKind(savedKind);
          lastSavedKind.current = savedKind;
        } else if (savedLegacyCategory) {
          const inferredKind = inferLegacyKind(savedLegacyCategory, savedDraft ?? '');
          setSelectedKind(inferredKind);
          lastSavedKind.current = inferredKind;
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

  const saveDraftNow = async (nameValue: string, descriptionValue: string, kind: TriggerKind | null) => {
    if (!loaded) return;
    if (
      nameValue === lastSavedName.current &&
      descriptionValue === lastSavedDescription.current &&
      kind === lastSavedKind.current
    ) {
      return;
    }

    try {
      await Promise.all([
        AsyncStorage.setItem(DRAFT_KEY, nameValue),
        AsyncStorage.setItem(DESCRIPTION_DRAFT_KEY, descriptionValue),
        kind ? AsyncStorage.setItem(KIND_KEY, kind) : AsyncStorage.removeItem(KIND_KEY),
        AsyncStorage.removeItem(LEGACY_CATEGORY_KEY),
      ]);
      lastSavedName.current = nameValue;
      lastSavedDescription.current = descriptionValue;
      lastSavedKind.current = kind;
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    if (!loaded) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveDraftNow(triggerName, description, selectedKind);
    }, 300);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [description, loaded, selectedKind, triggerName]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      void saveDraftNow(triggerName, description, selectedKind);
    });
    return () => sub.remove();
  }, [description, loaded, selectedKind, triggerName]);

  useEffect(() => {
    const pendingKind = pendingScrollKindRef.current;
    if (!pendingKind) return;

    const expanded = pendingKind === 'internal' ? internalExpanded : externalExpanded;
    if (!expanded) {
      pendingScrollKindRef.current = null;
      return;
    }

    const timer = setTimeout(() => {
      scrollToArchiveSection(pendingKind);
      pendingScrollKindRef.current = null;
    }, 80);

    return () => clearTimeout(timer);
  }, [externalExpanded, internalExpanded]);

  const persistItems = async (nextItems: TriggerItem[]) => {
    await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(nextItems));
  };

  const addItem = async (
    nextTriggerName: string,
    nextDescription: string,
    nextKind: TriggerKind,
    options?: { clearDraft?: boolean; success?: string },
  ) => {
    const trimmedName = nextTriggerName.trim();
    const trimmedDescription = nextDescription.trim();
    if (!trimmedName) return;

    const duplicate = items.some(
      (item) =>
        item.kind === nextKind &&
        normalizeComparableText(item.triggerName) === normalizeComparableText(trimmedName) &&
        normalizeComparableText(item.description) === normalizeComparableText(trimmedDescription),
    );

    if (duplicate) {
      setSelectedKind(nextKind);
      showFeedback('Taki wyzwalacz z tym opisem już jest na Twojej liście.');
      return;
    }

    const nextItem: TriggerItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      triggerName: trimmedName,
      description: trimmedDescription,
      kind: nextKind,
      createdAt: new Date().toISOString(),
    };

    const previousItems = items;
    const previousName = triggerName;
    const previousDescription = description;
    const previousKind = selectedKind;
    const nextItems = [nextItem, ...items];
    const clearDraft = options?.clearDraft === true;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    setItems(nextItems);
    if (clearDraft) {
      setTriggerName('');
      setDescription('');
      setSelectedKind(null);
    } else {
      setSelectedKind(nextKind);
    }

    try {
      await persistItems(nextItems);
      if (clearDraft) {
        await Promise.all([
          AsyncStorage.setItem(DRAFT_KEY, ''),
          AsyncStorage.setItem(DESCRIPTION_DRAFT_KEY, ''),
          AsyncStorage.removeItem(KIND_KEY),
          AsyncStorage.removeItem(LEGACY_CATEGORY_KEY),
        ]);
        lastSavedName.current = '';
        lastSavedDescription.current = '';
        lastSavedKind.current = null;
      }

      showFeedback(
        options?.success ??
          'Wyzwalacz z opisem dodany do listy.',
      );
    } catch {
      setItems(previousItems);
      setTriggerName(previousName);
      setDescription(previousDescription);
      setSelectedKind(previousKind);
      Alert.alert('Błąd zapisu', 'Nie udało się zapisać tej pozycji. Spróbuj ponownie.');
    }
  };

  const handleSave = async () => {
    const trimmedName = triggerName.trim();
    if (!trimmedName) {
      Alert.alert('Brak wyzwalacza', 'Najpierw nazwij konkretny wyzwalacz, który chcesz rozpoznawać wcześniej.');
      return;
    }
    if (!selectedKind) {
      Alert.alert('Wybierz rodzaj', 'Najpierw zaznacz, czy to jest wyzwalacz wewnętrzny czy zewnętrzny.');
      return;
    }

    await addItem(trimmedName, description, selectedKind, { clearDraft: true });
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
              await persistItems(nextItems);
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
      ? 'Na początek zapisz po 2-3 rzeczy z obu stron: co dzieje się w Tobie i co dzieje się wokół Ciebie.'
      : `Masz już ${getCountLabel(items.length)}. Dzięki temu wiesz o sobie trochę więcej.`;
  const introLead = 'Czym są tak zwane wyzwalacze zapewne już wiesz.';
  const introRest =
    'To wewnętrzne i zewnętrzne czynniki uruchamiające automatyzacje, często prowadzące do sytuacji nawrotowych. Ta lista to miejsce, gdzie możesz je zapisywać, żeby łatwiej było je zauważyć wcześniej i mieć plan, jak reagować.';

  const internalItems = items.filter((item) => item.kind === 'internal');
  const externalItems = items.filter((item) => item.kind === 'external');
  const triggerNamePlaceholder =
    selectedKind === 'internal'
      ? 'Np. samotność, zmęczenie, głód, napięcie'
      : selectedKind === 'external'
        ? 'Np. konflikt, wieczór sam w domu, konkretne miejsce'
        : 'Np. samotność, zmęczenie, konflikt, wieczór sam w domu';
  const descriptionPlaceholder =
    selectedKind === 'internal'
      ? 'Np. Najczęściej wieczorem, gdy brakuje mi bliskości albo kiedy coś mnie boli.'
      : selectedKind === 'external'
        ? 'Np. Najmocniej działa, gdy wracam do domu sam i nie mam planu na resztę wieczoru.'
        : 'Np. Kiedy się pojawia, z czym się wiąże, po czym poznajesz że to już ten schemat.';

  const scrollToArchiveSection = (kind: TriggerKind) => {
    const y = Math.max(0, sectionOffsetsRef.current[kind] - ARCHIVE_SCROLL_TOP_OFFSET);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    });
  };

  const toggleArchiveSection = (kind: TriggerKind) => {
    if (kind === 'internal') {
      setInternalExpanded((prev) => {
        const next = !prev;
        if (next) {
          pendingScrollKindRef.current = 'internal';
        }
        return next;
      });
      return;
    }

    setExternalExpanded((prev) => {
      const next = !prev;
      if (next) {
        pendingScrollKindRef.current = 'external';
      }
      return next;
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <BackButton />
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(64, insets.bottom + 40) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bgOrbA} />
        <View style={styles.bgOrbB} />

        <Text style={styles.title}>Lista wyzwalaczy</Text>
        <Text style={styles.subtitle}>
          {isIntroExpanded ? `${introLead} ${introRest}` : introLead}
        </Text>
        <Pressable style={styles.readMoreButton} onPress={() => setIsIntroExpanded((prev) => !prev)}>
          <Text style={styles.readMoreText}>{isIntroExpanded ? 'Mniej' : 'Czytaj więcej'}</Text>
        </Pressable>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>To ważne dla Ciebie</Text>
          <Text style={styles.infoText}>
            Kiedy wyzwalacz jest nazwany, łatwiej nie dać się zaskoczyć.
          </Text>
          {isInfoExpanded ? <Text style={styles.infoText}>{summaryText}</Text> : null}
          <Pressable style={styles.infoReadMoreButton} onPress={() => setIsInfoExpanded((prev) => !prev)}>
            <Text style={styles.readMoreText}>{isInfoExpanded ? 'Mniej' : 'Czytaj więcej'}</Text>
          </Pressable>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.cardAccent} />
          <Text style={styles.sectionTitle}>Dodaj wyzwalacz i jego opis</Text>
          <Text style={styles.sectionText}>
            Najpierw nazwij wyzwalacz, a potem dopisz kiedy się pojawia, z czym się wiąże i jak zwykle wygląda ten schemat.
          </Text>

          <View style={styles.kindRow}>
            {(['internal', 'external'] as TriggerKind[]).map((kind) => {
              const active = selectedKind === kind;
              return (
                <Pressable
                  key={kind}
                  style={[styles.kindButton, active && styles.kindButtonActive]}
                  onPress={() => setSelectedKind((prev) => (prev === kind ? null : kind))}
                >
                  <Text style={[styles.kindButtonTitle, active && styles.kindButtonTitleActive]}>{getKindLabel(kind)}</Text>
                  <Text style={[styles.kindButtonText, active && styles.kindButtonTextActive]}>
                    {kind === 'internal' ? 'stany, emocje, napięcie' : 'osoby, miejsca, pory, sytuacje'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Wyzwalacz</Text>
          <TextInput
            value={triggerName}
            onChangeText={setTriggerName}
            onBlur={() => void saveDraftNow(triggerName, description, selectedKind)}
            placeholder={triggerNamePlaceholder}
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={[styles.input, styles.inputCompact]}
          />

          <Text style={styles.inputLabel}>Opis / schemat</Text>
          <Text style={styles.inputHint}>
            To pole jest opcjonalne, ale pomaga zobaczyć kiedy ten wyzwalacz naprawdę działa.
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            onBlur={() => void saveDraftNow(triggerName, description, selectedKind)}
            placeholder={descriptionPlaceholder}
            placeholderTextColor="rgba(255,255,255,0.45)"
            multiline
            textAlignVertical="top"
            style={styles.input}
          />

          {feedback ? (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedback}>{feedback}</Text>
            </View>
          ) : null}

          <Pressable style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>Dodaj do listy</Text>
          </Pressable>
        </View>

        <View
          style={styles.archiveCard}
          onLayout={(event) => {
            archiveCardOffsetRef.current = event.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.archiveTitle}>Twoja lista ({items.length})</Text>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>Na razie nic tu nie ma. Zacznij od pierwszej konkretnej rzeczy, która zwykle poprzedza gorszy moment.</Text>
          ) : (
            <>
              <View
                style={styles.archiveSection}
                onLayout={(event) => {
                  sectionOffsetsRef.current.internal = archiveCardOffsetRef.current + event.nativeEvent.layout.y;
                }}
              >
                <View style={styles.archiveSectionHeader}>
                  <Text style={styles.archiveSectionTitle}>Wewnętrzne ({internalItems.length})</Text>
                  <Pressable style={styles.archiveToggleButton} onPress={() => toggleArchiveSection('internal')}>
                    <Text style={styles.archiveToggleButtonText}>{internalExpanded ? 'Ukryj listę' : 'Pokaż listę'}</Text>
                  </Pressable>
                </View>
                {internalExpanded ? (
                  internalItems.length === 0 ? (
                    <Text style={styles.sectionEmptyText}>Na razie nic tu nie ma.</Text>
                  ) : (
                    internalItems.map((item) => (
                      <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                          <View style={styles.itemMeta}>
                            <View style={styles.itemCategory}>
                              <Text style={styles.itemCategoryText}>Wewnętrzne</Text>
                            </View>
                            <Text style={styles.itemDate}>{formatSavedDate(item.createdAt)}</Text>
                          </View>
                          <Pressable style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                            <Text style={styles.deleteButtonText}>Usuń</Text>
                          </Pressable>
                        </View>
                        <Text style={styles.itemTitle}>{item.triggerName}</Text>
                        {item.description.length > 0 ? <Text style={styles.itemDescription}>{item.description}</Text> : null}
                      </View>
                    ))
                  )
                ) : (
                  <Text style={styles.sectionClosedText}>Lista ukryta.</Text>
                )}
              </View>

              <View
                style={styles.archiveSection}
                onLayout={(event) => {
                  sectionOffsetsRef.current.external = archiveCardOffsetRef.current + event.nativeEvent.layout.y;
                }}
              >
                <View style={styles.archiveSectionHeader}>
                  <Text style={styles.archiveSectionTitle}>Zewnętrzne ({externalItems.length})</Text>
                  <Pressable style={styles.archiveToggleButton} onPress={() => toggleArchiveSection('external')}>
                    <Text style={styles.archiveToggleButtonText}>{externalExpanded ? 'Ukryj listę' : 'Pokaż listę'}</Text>
                  </Pressable>
                </View>
                {externalExpanded ? (
                  externalItems.length === 0 ? (
                    <Text style={styles.sectionEmptyText}>Na razie nic tu nie ma.</Text>
                  ) : (
                    externalItems.map((item) => (
                      <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                          <View style={styles.itemMeta}>
                            <View style={styles.itemCategory}>
                              <Text style={styles.itemCategoryText}>Zewnętrzne</Text>
                            </View>
                            <Text style={styles.itemDate}>{formatSavedDate(item.createdAt)}</Text>
                          </View>
                          <Pressable style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                            <Text style={styles.deleteButtonText}>Usuń</Text>
                          </Pressable>
                        </View>
                        <Text style={styles.itemTitle}>{item.triggerName}</Text>
                        {item.description.length > 0 ? <Text style={styles.itemDescription}>{item.description}</Text> : null}
                      </View>
                    ))
                  )
                ) : (
                  <Text style={styles.sectionClosedText}>Lista ukryta.</Text>
                )}
              </View>
            </>
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
    marginBottom: 2,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    paddingVertical: 2,
  },
  readMoreText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '700',
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
  infoReadMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingVertical: 2,
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
  kindRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  kindButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(198,215,255,0.35)',
    backgroundColor: 'rgba(7,24,38,0.32)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  kindButtonActive: {
    borderColor: 'rgba(226,244,255,0.95)',
    backgroundColor: 'rgba(198,215,255,0.26)',
  },
  kindButtonTitle: {
    color: 'white',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  kindButtonTitleActive: {
    color: 'white',
  },
  kindButtonText: {
    color: 'rgba(240,248,255,0.74)',
    fontSize: 12,
    lineHeight: 16,
  },
  kindButtonTextActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  inputLabel: {
    color: 'white',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputHint: {
    color: 'rgba(232,245,255,0.74)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
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
  inputCompact: {
    minHeight: 58,
    marginBottom: 12,
  },
  feedbackCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(176,236,201,0.55)',
    backgroundColor: 'rgba(74,139,105,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  feedback: {
    color: '#F3FFF8',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
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
  archiveSection: {
    marginTop: 10,
  },
  archiveSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  archiveSectionTitle: {
    color: 'white',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  archiveToggleButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(198,215,255,0.4)',
    backgroundColor: 'rgba(198,215,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  archiveToggleButtonText: {
    color: '#E4F0FF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionClosedText: {
    color: 'rgba(232,245,255,0.62)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  sectionEmptyText: {
    color: SUB,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
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
  itemTitle: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  itemDescription: {
    color: SUB,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
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
