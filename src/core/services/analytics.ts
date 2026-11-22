import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../firebase/config';

/**
 * Mesure anonyme : des COMPTEURS agrégés (jamais d'identifiant, jamais de contenu personnel).
 * Les compteurs sont additionnés localement puis envoyés en un seul écrit atomique vers Firestore :
 *   stats/global        → totaux depuis le début
 *   stats/d_AAAA-MM-JJ  → totaux du jour (courbes dans le temps)
 * Un écrit par envoi (pas un écrit par événement) : reste dans le quota gratuit même avec beaucoup de joueurs.
 */

export type Track = 'new' | 'debutant' | 'intermediaire' | 'avance';
export type Difficulty = 'easy' | 'ok' | 'hard';

export type AppEvent =
  | { e: 'open'; track: Track; newPlayer: boolean; retDay: number | null }
  | { e: 'diag_start'; track: Track }
  | { e: 'diag_answer'; qid: string; result: 'right' | 'wrong' | 'skip' }
  | { e: 'diag_done'; correct: number; place: Track }
  | { e: 'beginner_pick' }
  | { e: 'level_start'; track: Track; levelId: number }
  | { e: 'trade'; track: Track; levelId: number; reason: string; compliant: boolean }
  | { e: 'level_end'; track: Track; levelId: number; stars: number; discipline: number; passed: boolean }
  | { e: 'level_quit'; track: Track; levelId: number }
  | { e: 'quiz_end'; track: Track; levelId: number; stars: number }
  | { e: 'broke'; track: Track }
  | { e: 'refill'; track: Track }
  | { e: 'speed'; track: Track; to: number }
  | { e: 'rate'; track: Track; levelId: number; v: Difficulty };

/* ---------- Compteurs imbriqués (fonctions pures, testées) ---------- */

export type Counts = { [key: string]: number | Counts };

export function bump(c: Counts, path: (string | number)[], n = 1): Counts {
  let node = c;
  for (let i = 0; i < path.length - 1; i++) {
    const k = String(path[i]);
    const next = node[k];
    if (typeof next !== 'object' || next === null) node[k] = {};
    node = node[k] as Counts;
  }
  const last = String(path[path.length - 1]);
  node[last] = ((node[last] as number | undefined) ?? 0) + n;
  return c;
}

export function mergeCounts(a: Counts, b: Counts): Counts {
  const out: Counts = JSON.parse(JSON.stringify(a));
  const walk = (src: Counts, dst: Counts) => {
    for (const k of Object.keys(src)) {
      const v = src[k];
      if (typeof v === 'number') dst[k] = ((dst[k] as number | undefined) ?? 0) + v;
      else {
        if (typeof dst[k] !== 'object' || dst[k] === null) dst[k] = {};
        walk(v, dst[k] as Counts);
      }
    }
  };
  walk(b, out);
  return out;
}

export const isEmptyCounts = (c: Counts): boolean => Object.keys(c).length === 0;

/** Remplace chaque nombre par increment(n) (ou toute autre transformation) : sert à l'envoi Firestore. */
export function mapNumbers<T>(c: Counts, fn: (n: number) => T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(c)) {
    const v = c[k];
    out[k] = typeof v === 'number' ? fn(v) : mapNumbers(v, fn);
  }
  return out;
}

/** Ce que contient un événement, en compteurs. */
export function countsFor(ev: AppEvent): Counts {
  const c: Counts = {};
  switch (ev.e) {
    case 'open':
      bump(c, ['c', 'open', ev.track]);
      if (ev.newPlayer) bump(c, ['cohort', 'n']);
      if (ev.retDay !== null) bump(c, ['ret', `d${ev.retDay}`]);
      break;
    case 'diag_start':
      bump(c, ['c', 'diag_start', ev.track]);
      break;
    case 'diag_answer':
      bump(c, ['dq', ev.qid, ev.result]);
      break;
    case 'diag_done':
      bump(c, ['diag', 'score', ev.correct]);
      bump(c, ['diag', 'place', ev.place]);
      break;
    case 'beginner_pick':
      bump(c, ['c', 'beginner_pick', 'new']);
      break;
    case 'level_start':
      bump(c, ['c', 'level_start', ev.track]);
      bump(c, ['lv', ev.levelId, 'start']);
      bump(c, ['lvt', ev.track, ev.levelId, 'start']);
      break;
    case 'trade':
      bump(c, ['c', 'trade', ev.track]);
      bump(c, ['why', ev.reason, ev.track]);
      bump(c, ['lv', ev.levelId, ev.compliant ? 'trade_ok' : 'trade_bad']);
      break;
    case 'level_end':
      bump(c, ['c', 'level_end', ev.track]);
      if (ev.passed) bump(c, ['c', 'level_pass', ev.track]);
      bump(c, ['lv', ev.levelId, 'end']);
      bump(c, ['lv', ev.levelId, 'stars'], ev.stars);
      bump(c, ['lv', ev.levelId, 'disc'], Math.round(ev.discipline));
      bump(c, ['lvt', ev.track, ev.levelId, 'end']);
      if (ev.passed) {
        bump(c, ['lv', ev.levelId, 'pass']);
        bump(c, ['lvt', ev.track, ev.levelId, 'pass']);
      }
      break;
    case 'level_quit':
      bump(c, ['c', 'level_quit', ev.track]);
      bump(c, ['lv', ev.levelId, 'quit']);
      bump(c, ['lvt', ev.track, ev.levelId, 'quit']);
      break;
    case 'quiz_end':
      bump(c, ['c', 'quiz_end', ev.track]);
      bump(c, ['lv', ev.levelId, 'end']);
      bump(c, ['lv', ev.levelId, 'stars'], ev.stars);
      if (ev.stars >= 1) bump(c, ['lv', ev.levelId, 'pass']);
      break;
    case 'broke':
      bump(c, ['c', 'broke', ev.track]);
      break;
    case 'refill':
      bump(c, ['c', 'refill', ev.track]);
      break;
    case 'speed':
      bump(c, ['spd', String(ev.to).replace('.', '_'), ev.track]);
      break;
    case 'rate':
      bump(c, ['diff', ev.levelId, ev.v]);
      bump(c, ['diffT', ev.track, ev.v]);
      break;
  }
  return c;
}

/** Le document du jour ne garde que ce qui sert aux courbes dans le temps. */
export function dailyOf(c: Counts): Counts {
  const out: Counts = {};
  for (const k of ['c', 'cohort', 'ret']) if (c[k] !== undefined) out[k] = c[k];
  return out;
}

/* ---------- Envoi (réseau) ---------- */

const PENDING_KEY = 'simtra:stats-pending';
const FLUSH_DELAY_MS = 15000;
const COMMIT_TIMEOUT_MS = 12000;

let enabled = false;
let pending: Counts = {};
let timer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

const todayUtc = () => new Date().toISOString().slice(0, 10);

export function setAnalyticsEnabled(on: boolean): void {
  enabled = on;
  if (!on) {
    pending = {};
    if (timer) clearTimeout(timer);
    timer = null;
    AsyncStorage.removeItem(PENDING_KEY).catch(() => {});
  }
}

/** Reprend les compteurs non envoyés d'une session précédente (appli fermée avant l'envoi). */
export async function restorePending(): Promise<void> {
  if (!enabled) return;
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    if (raw) pending = mergeCounts(JSON.parse(raw) as Counts, pending);
    await AsyncStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
  if (!isEmptyCounts(pending)) schedule();
}

function schedule() {
  if (timer || !enabled) return;
  timer = setTimeout(() => { timer = null; void flush(); }, FLUSH_DELAY_MS);
}

export function track(ev: AppEvent): void {
  if (!enabled) return;
  try {
    pending = mergeCounts(pending, countsFor(ev));
    schedule();
  } catch {
    /* la mesure ne doit jamais faire planter le jeu */
  }
}

/** Envoi immédiat ; à appeler quand l'appli passe en arrière-plan. */
export async function flush(): Promise<void> {
  if (!enabled || flushing || isEmptyCounts(pending)) return;
  flushing = true;
  const batch = pending;
  pending = {};
  try {
    const [db, fs] = await Promise.all([getDb(), import('firebase/firestore')]);
    const inc = (n: number) => fs.increment(n);
    const wb = fs.writeBatch(db);
    wb.set(fs.doc(db, 'stats', 'global'), mapNumbers(batch, inc), { merge: true });
    const daily = dailyOf(batch);
    if (!isEmptyCounts(daily)) wb.set(fs.doc(db, 'stats', `d_${todayUtc()}`), mapNumbers(daily, inc), { merge: true });
    // Hors ligne, commit() attend le réseau : au bout de 12 s on laisse le SDK livrer en différé (pas de renvoi → pas de doublon).
    await Promise.race([wb.commit(), new Promise<void>((res) => setTimeout(res, COMMIT_TIMEOUT_MS))]);
  } catch {
    pending = mergeCounts(batch, pending); // refus explicite : on garde pour le prochain envoi
  } finally {
    flushing = false;
  }
}

/** Sauvegarde locale des compteurs en attente (appli mise en arrière-plan) puis tentative d'envoi. */
export async function persistAndFlush(): Promise<void> {
  if (!enabled) return;
  try {
    if (!isEmptyCounts(pending)) await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    /* ignore */
  }
  await flush();
  if (isEmptyCounts(pending)) AsyncStorage.removeItem(PENDING_KEY).catch(() => {});
}

/* ---------- Lecture (tableau de bord) ---------- */

export async function fetchStats(): Promise<Counts | null> {
  try {
    const [db, fs] = await Promise.all([getDb(), import('firebase/firestore')]);
    const snap = await Promise.race([
      fs.getDoc(fs.doc(db, 'stats', 'global')),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000)),
    ]);
    return snap.exists() ? (snap.data() as Counts) : {};
  } catch {
    return null;
  }
}
