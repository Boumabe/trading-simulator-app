import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import type { BookItem, Lang, QuizData, QuizQuestion } from '../types';
import { getDb } from './config';

const TTL_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;
const cacheKey = (name: string) => `simtra:cache:${name}`;

type Doc = Record<string, unknown> & { id: string };

async function readCache(name: string): Promise<{ t: number; docs: Doc[] } | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(name));
    return raw ? (JSON.parse(raw) as { t: number; docs: Doc[] }) : null;
  } catch {
    return null;
  }
}

/** Lit une collection avec cache 24 h ; en cas d'échec réseau, renvoie le cache même périmé. */
export async function fetchCollection(name: string): Promise<Doc[] | null> {
  const cached = await readCache(name);
  if (cached && Date.now() - cached.t < TTL_MS) return cached.docs;
  try {
    const fetched = await Promise.race([
      (async () => {
        const [db, { collection, getDocs }] = await Promise.all([getDb(), import('firebase/firestore')]);
        const snap = await getDocs(collection(db, name));
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Doc);
      })(),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT_MS)),
    ]);
    if (fetched.length) {
      AsyncStorage.setItem(cacheKey(name), JSON.stringify({ t: Date.now(), docs: fetched })).catch(() => {});
      return fetched;
    }
    return cached?.docs ?? null;
  } catch {
    return cached?.docs ?? null;
  }
}

/* ---------- Validation : un document mal formé est ignoré au lieu de faire planter l'écran ---------- */

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isL10n = (v: unknown) => isObj(v) && typeof v.fr === 'string';

export function isBookItem(d: Doc): boolean {
  if (typeof d.id !== 'string' || !isL10n(d.title) || !isL10n(d.def)) return false;
  if (d.points !== undefined && !(isObj(d.points) && Array.isArray(d.points.fr))) return false;
  return true;
}

export function isQuizQuestion(q: unknown): q is QuizQuestion {
  return (
    isObj(q) && typeof q.prompt === 'string' && Array.isArray(q.options) && q.options.length >= 2 &&
    q.options.every((o) => typeof o === 'string') && Number.isInteger(q.correctIndex) &&
    (q.correctIndex as number) >= 0 && (q.correctIndex as number) < q.options.length && typeof q.explanation === 'string'
  );
}

/** Fusionne quiz distants et locaux quiz par quiz (avant : le distant remplaçait TOUT le local). */
export function mergeQuizzes(local: QuizData, remote: Doc[] | null): QuizData {
  if (!remote) return local;
  const out: QuizData = { ...local };
  for (const d of remote) {
    const merged: Partial<Record<Lang, QuizQuestion[]>> = { ...(local[d.id] ?? {}) };
    for (const lang of ['fr', 'en', 'es'] as const) {
      const arr = d[lang];
      if (Array.isArray(arr) && arr.length && arr.every(isQuizQuestion)) merged[lang] = arr as QuizQuestion[];
    }
    out[d.id] = merged;
  }
  return out;
}

/** Trie selon le champ `order` distant, sinon selon l'ordre local (programme), sinon par id. */
export function orderItems<T extends { id: string }>(items: T[], localOrder: string[]): T[] {
  const pos = (it: T & { order?: unknown }) => (typeof it.order === 'number' ? it.order : localOrder.indexOf(it.id) >= 0 ? localOrder.indexOf(it.id) : 1e6);
  return items.slice().sort((a, b) => pos(a) - pos(b) || a.id.localeCompare(b.id));
}

/** Affiche tout de suite le contenu local, puis le remplace si une version distante valide arrive. */
export function useBookContent(collectionName: 'strategies' | 'glossary', local: BookItem[]): BookItem[] {
  const [items, setItems] = useState<BookItem[]>(local);
  useEffect(() => {
    let alive = true;
    fetchCollection(collectionName).then((docs) => {
      if (!alive || !docs) return;
      const valid = docs.filter(isBookItem) as unknown as BookItem[];
      if (valid.length) setItems(orderItems(valid, local.map((l) => l.id)));
    });
    return () => { alive = false; };
  }, [collectionName, local]);
  return items;
}

export function useQuizData(local: QuizData): QuizData {
  const [data, setData] = useState<QuizData>(local);
  useEffect(() => {
    let alive = true;
    fetchCollection('quizzes').then((docs) => alive && setData(mergeQuizzes(local, docs)));
    return () => { alive = false; };
  }, [local]);
  return data;
}
