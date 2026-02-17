import { COMMUNITY_GROUPS } from '@/constants/community';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THREADS_KEY = '@community_threads_v1';
const COMMENTS_KEY = '@community_comments_v1';
const MAIN_ROOM_MESSAGES_KEY = '@community_main_room_messages_v1';
const SEEDED_KEY = '@community_seeded_v1';

export type CommunityThread = {
  id: string;
  groupId: string;
  title: string;
  body: string;
  authorAlias: string;
  createdAt: string;
  commentCount: number;
  lastActivityAt: string;
};

export type CommunityComment = {
  id: string;
  threadId: string;
  body: string;
  authorAlias: string;
  createdAt: string;
};

export type MainRoomMessage = {
  id: string;
  authorAlias: string;
  body: string;
  createdAt: string;
};

export type MainRoomParticipant = {
  alias: string;
  lastActivityAt: string;
};

type CreateThreadInput = {
  groupId: string;
  title: string;
  body: string;
  authorAlias: string;
};

type CreateCommentInput = {
  threadId: string;
  body: string;
  authorAlias: string;
};

type SendMainRoomMessageInput = {
  body: string;
  authorAlias: string;
};

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function ensureSeedData() {
  const now = nowIso();
  const seedThreads: CommunityThread[] = [
    {
      id: 'thread_witaj',
      groupId: 'codziennosc',
      title: 'Witajcie! Jak planujecie swój dzień?',
      body: 'Podzielcie się jednym małym krokiem, który dziś chcecie zrobić dla siebie.',
      authorAlias: 'Anioł-Stróż',
      createdAt: now,
      commentCount: 1,
      lastActivityAt: now,
    },
    {
      id: 'thread_kryzys_1',
      groupId: 'kryzys',
      title: 'Co pomaga Wam przetrwać najtrudniejsze 15 minut?',
      body: 'Szukam prostych, sprawdzonych sposobów na szybkie uspokojenie.',
      authorAlias: 'SpokojnyKrok',
      createdAt: now,
      commentCount: 0,
      lastActivityAt: now,
    },
  ];

  const seedComments: CommunityComment[] = [
    {
      id: 'comment_witaj_1',
      threadId: 'thread_witaj',
      body: 'U mnie działa krótki spacer i zapisanie 3 najważniejszych rzeczy na dziś.',
      authorAlias: 'NowyStart',
      createdAt: now,
    },
  ];

  const seedMainRoomMessages: MainRoomMessage[] = [
    {
      id: 'main_1',
      authorAlias: 'Anioł-Stróż',
      body: 'Witajcie na pokoju głównym. Napiszcie, jak się dziś trzymacie.',
      createdAt: now,
    },
    {
      id: 'main_2',
      authorAlias: 'NowyStart',
      body: 'Dziś spokojniej niż wczoraj. Trzymam się planu dnia.',
      createdAt: now,
    },
    {
      id: 'main_3',
      authorAlias: 'SpokojnyKrok',
      body: 'Super, u mnie pomaga krótki spacer i oddychanie 4-6.',
      createdAt: now,
    },
  ];

  const seeded = await AsyncStorage.getItem(SEEDED_KEY);
  if (seeded !== '1') {
    await Promise.all([
      writeJson(THREADS_KEY, seedThreads),
      writeJson(COMMENTS_KEY, seedComments),
      writeJson(MAIN_ROOM_MESSAGES_KEY, seedMainRoomMessages),
      AsyncStorage.setItem(SEEDED_KEY, '1'),
    ]);
    return;
  }

  const [existingThreads, existingComments, existingMainRoomMessages] = await Promise.all([
    AsyncStorage.getItem(THREADS_KEY),
    AsyncStorage.getItem(COMMENTS_KEY),
    AsyncStorage.getItem(MAIN_ROOM_MESSAGES_KEY),
  ]);

  const repairs: Array<Promise<void>> = [];
  if (!existingThreads) repairs.push(writeJson(THREADS_KEY, seedThreads));
  if (!existingComments) repairs.push(writeJson(COMMENTS_KEY, seedComments));
  if (!existingMainRoomMessages) repairs.push(writeJson(MAIN_ROOM_MESSAGES_KEY, seedMainRoomMessages));
  if (repairs.length > 0) {
    await Promise.all(repairs);
  }
}

export async function listCommunityGroups() {
  await ensureSeedData();
  return COMMUNITY_GROUPS;
}

export async function getCommunityGroup(groupId: string) {
  await ensureSeedData();
  return COMMUNITY_GROUPS.find((group) => group.id === groupId) ?? null;
}

export async function listThreadsByGroup(groupId: string) {
  await ensureSeedData();
  const all = await readJson<CommunityThread[]>(THREADS_KEY, []);
  return all
    .filter((thread) => thread.groupId === groupId)
    .sort((a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt));
}

export async function getThreadById(threadId: string) {
  await ensureSeedData();
  const all = await readJson<CommunityThread[]>(THREADS_KEY, []);
  return all.find((thread) => thread.id === threadId) ?? null;
}

export async function listCommentsByThread(threadId: string) {
  await ensureSeedData();
  const all = await readJson<CommunityComment[]>(COMMENTS_KEY, []);
  return all
    .filter((comment) => comment.threadId === threadId)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export async function createCommunityThread(input: CreateThreadInput) {
  await ensureSeedData();
  const all = await readJson<CommunityThread[]>(THREADS_KEY, []);
  const createdAt = nowIso();

  const nextThread: CommunityThread = {
    id: createId('thread'),
    groupId: input.groupId,
    title: input.title.trim(),
    body: input.body.trim(),
    authorAlias: input.authorAlias.trim(),
    createdAt,
    commentCount: 0,
    lastActivityAt: createdAt,
  };

  const next = [nextThread, ...all];
  await writeJson(THREADS_KEY, next);
  return nextThread;
}

export async function createCommunityComment(input: CreateCommentInput) {
  await ensureSeedData();
  const [allComments, allThreads] = await Promise.all([
    readJson<CommunityComment[]>(COMMENTS_KEY, []),
    readJson<CommunityThread[]>(THREADS_KEY, []),
  ]);

  const createdAt = nowIso();
  const nextComment: CommunityComment = {
    id: createId('comment'),
    threadId: input.threadId,
    body: input.body.trim(),
    authorAlias: input.authorAlias.trim(),
    createdAt,
  };

  const updatedThreads = allThreads.map((thread) =>
    thread.id === input.threadId
      ? {
          ...thread,
          commentCount: thread.commentCount + 1,
          lastActivityAt: createdAt,
        }
      : thread
  );

  await Promise.all([
    writeJson(COMMENTS_KEY, [...allComments, nextComment]),
    writeJson(THREADS_KEY, updatedThreads),
  ]);

  return nextComment;
}

export async function listMainRoomMessages(limit = 200) {
  await ensureSeedData();
  const all = await readJson<MainRoomMessage[]>(MAIN_ROOM_MESSAGES_KEY, []);
  const sorted = [...all].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  if (sorted.length <= limit) return sorted;
  return sorted.slice(sorted.length - limit);
}

export async function sendMainRoomMessage(input: SendMainRoomMessageInput) {
  await ensureSeedData();
  const all = await readJson<MainRoomMessage[]>(MAIN_ROOM_MESSAGES_KEY, []);

  const nextMessage: MainRoomMessage = {
    id: createId('main'),
    authorAlias: input.authorAlias.trim(),
    body: input.body.trim(),
    createdAt: nowIso(),
  };

  const next = [...all, nextMessage];
  const compact = next.length > 500 ? next.slice(next.length - 500) : next;
  await writeJson(MAIN_ROOM_MESSAGES_KEY, compact);
  return nextMessage;
}

export async function listMainRoomParticipants(limit = 12): Promise<MainRoomParticipant[]> {
  const messages = await listMainRoomMessages(400);
  const map = new Map<string, MainRoomParticipant>();

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message.authorAlias) continue;
    if (map.has(message.authorAlias)) continue;

    map.set(message.authorAlias, {
      alias: message.authorAlias,
      lastActivityAt: message.createdAt,
    });

    if (map.size >= limit) break;
  }

  return Array.from(map.values());
}
