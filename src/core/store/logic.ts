import { ECONOMY } from '../constants';
import { starsFor, xpForLevel, xpForTrade, type Stars } from '../engine/scoring';
import type { TradeResult } from '../engine/rules';
import type { LangSetting } from '../types';
import type { StartChoice } from '../data/levels';
import { ACHIEVEMENTS } from './achievements';
import { rankOf } from './ranks';

export interface LevelProgress { stars: number; best: number; plays: number; passes: number }

export interface Persisted {
  v: 2;
  balance: number;
  xp: number;
  choice: StartChoice | null;
  levels: Record<number, LevelProgress>;
  streak: { count: number; best: number };
  daily: { lastClaimDay: string | null; lastSeen: number };
  refillDay: string | null;
  achievements: Record<string, number>;
  stats: { trades: number; compliant: number; bestCombo: number; sessions: number; perfect: number; sniper: number; quizPerfect: number };
  settings: { sound: boolean; haptics: boolean; lang: LangSetting };
  seenTour: boolean;
  checklist: number[];
}

export interface Banner {
  id: number;
  kind: 'achievement' | 'rank' | 'streak' | 'info';
  icon: string;
  eyebrowKey: string;
  titleKey: string;
  titleParams?: Record<string, string | number>;
  subKey?: string;
}

export interface GameState extends Persisted {
  ready: boolean;
  queue: Banner[];
  walletEvent: { id: number; amount: number } | null;
  nextId: number;
}

export const defaultPersisted = (): Persisted => ({
  v: 2,
  balance: ECONOMY.START_BALANCE,
  xp: 0,
  choice: null,
  levels: {},
  streak: { count: 0, best: 0 },
  daily: { lastClaimDay: null, lastSeen: 0 },
  refillDay: null,
  achievements: {},
  stats: { trades: 0, compliant: 0, bestCombo: 0, sessions: 0, perfect: 0, sniper: 0, quizPerfect: 0 },
  settings: { sound: true, haptics: true, lang: 'auto' },
  seenTour: false,
  checklist: [],
});

export const initialState = (): GameState => ({ ...defaultPersisted(), ready: false, queue: [], walletEvent: null, nextId: 1 });

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Jour local au format AAAA-MM-JJ. */
export function dayKey(now: number): string {
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

type Out<T> = { state: GameState; result: T };

function push(s: GameState, b: Omit<Banner, 'id'>): GameState {
  return { ...s, queue: [...s.queue, { ...b, id: s.nextId }], nextId: s.nextId + 1 };
}

function withWallet(s: GameState, delta: number): { state: GameState; applied: number } {
  const balance = Math.max(0, round2(s.balance + delta));
  const applied = round2(balance - s.balance);
  if (applied === 0) return { state: s, applied: 0 };
  return { state: { ...s, balance, walletEvent: { id: s.nextId, amount: applied }, nextId: s.nextId + 1 }, applied };
}

/** Débloque les succès atteints et le nouveau rang éventuel ; empile les bannières. */
function settleRewards(prev: GameState, next: GameState, now: number): { state: GameState; unlocked: string[]; rankUp: number | null } {
  let s = next;
  const unlocked: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!s.achievements[a.id] && a.test(s)) {
      s = { ...s, achievements: { ...s.achievements, [a.id]: now } };
      s = push(s, { kind: 'achievement', icon: a.icon, eyebrowKey: 'banner_achievement', titleKey: `ach_${a.id}_t`, subKey: `ach_${a.id}_d` });
      unlocked.push(a.id);
    }
  }
  const before = rankOf(prev.xp).index;
  const after = rankOf(s.xp).index;
  let rankUp: number | null = null;
  if (after > before) {
    rankUp = after;
    s = push(s, { kind: 'rank', icon: '🏅', eyebrowKey: 'banner_rank_up', titleKey: rankOf(s.xp).key });
  }
  return { state: s, unlocked, rankUp };
}

export interface TradeReward { delta: number; xp: number; unlocked: string[]; rankUp: number | null }

export function applyTrade(s: GameState, a: { trade: TradeResult; combo: number; levelId: number; now: number }): Out<TradeReward> {
  const passes = s.levels[a.levelId]?.passes ?? 0;
  let delta = a.trade.net;
  if (delta > 0 && passes >= ECONOMY.REPLAY_FULL_PAYOUTS) delta = round2(delta * ECONOMY.REPLAY_FACTOR);
  const w = withWallet(s, delta);
  const xp = xpForTrade(a.trade.compliant, a.combo);
  let next: GameState = {
    ...w.state,
    xp: s.xp + xp,
    stats: {
      ...s.stats,
      trades: s.stats.trades + 1,
      compliant: s.stats.compliant + (a.trade.compliant ? 1 : 0),
      bestCombo: Math.max(s.stats.bestCombo, a.combo),
    },
  };
  const r = settleRewards(s, next, a.now);
  next = r.state;
  return { state: next, result: { delta: w.applied, xp, unlocked: r.unlocked, rankUp: r.rankUp } };
}

export interface LevelResult { passed: boolean; stars: Stars; xp: number; improved: boolean; unlocked: string[]; rankUp: number | null }

export function completeLevel(s: GameState, a: { levelId: number; discipline: number; trades: number; sniperAccuracy?: number; now: number }): Out<LevelResult> {
  const stars = starsFor(a.discipline, a.trades);
  const prev = s.levels[a.levelId] ?? { stars: 0, best: 0, plays: 0, passes: 0 };
  const xp = xpForLevel(stars, prev.best);
  const improved = stars > prev.best;
  const levels = {
    ...s.levels,
    [a.levelId]: { stars: Math.max(prev.stars, stars), best: Math.max(prev.best, stars), plays: prev.plays + 1, passes: prev.passes + (stars >= 1 ? 1 : 0) },
  };
  let next: GameState = {
    ...s,
    levels,
    xp: s.xp + xp,
    stats: {
      ...s.stats,
      sessions: s.stats.sessions + 1,
      perfect: s.stats.perfect + (stars === 3 && prev.best < 3 ? 1 : 0),
      sniper: s.stats.sniper + (a.sniperAccuracy !== undefined && a.sniperAccuracy >= 0.8 && stars >= 1 ? 1 : 0),
    },
  };
  const r = settleRewards(s, next, a.now);
  return { state: r.state, result: { passed: stars >= 1, stars, xp, improved, unlocked: r.unlocked, rankUp: r.rankUp } };
}

export function completeQuiz(s: GameState, a: { levelId: number; correct: number; total: number; now: number }): Out<LevelResult> {
  const pct = a.total ? Math.round((a.correct / a.total) * 100) : 0;
  const stars = (pct >= 100 ? 3 : pct >= 75 ? 2 : pct >= 50 ? 1 : 0) as Stars;
  const prev = s.levels[a.levelId] ?? { stars: 0, best: 0, plays: 0, passes: 0 };
  const xp = xpForLevel(stars, prev.best);
  const levels = {
    ...s.levels,
    [a.levelId]: { stars: Math.max(prev.stars, stars), best: Math.max(prev.best, stars), plays: prev.plays + 1, passes: prev.passes + (stars >= 1 ? 1 : 0) },
  };
  let next: GameState = {
    ...s, levels, xp: s.xp + xp,
    stats: { ...s.stats, quizPerfect: s.stats.quizPerfect + (stars === 3 && prev.best < 3 ? 1 : 0) },
  };
  const r = settleRewards(s, next, a.now);
  next = r.state;
  return { state: next, result: { passed: stars >= 1, stars, xp, improved: stars > prev.best, unlocked: r.unlocked, rankUp: r.rankUp } };
}

/* ---------- Coffre du jour ---------- */

export const dailyReward = (streak: number): number => ECONOMY.DAILY_BASE + ECONOMY.DAILY_STEP * Math.min(Math.max(streak - 1, 0), ECONOMY.DAILY_MAX_STEPS);

/** Anti-triche léger : si l'horloge recule de plus de 5 min, le coffre est refusé. */
const CLOCK_TOLERANCE_MS = 5 * 60 * 1000;

export function dailyAvailable(s: GameState, now: number): boolean {
  if (now < s.daily.lastSeen - CLOCK_TOLERANCE_MS) return false;
  return s.daily.lastClaimDay !== dayKey(now);
}

/** Streak affiché : retombe à 0 si un jour a été manqué. */
export function liveStreak(s: GameState, now: number): number {
  const last = s.daily.lastClaimDay;
  if (!last) return 0;
  return daysBetween(last, dayKey(now)) > 1 ? 0 : s.streak.count;
}

export interface DailyReward { reward: number; streak: number; xp: number }

export function claimDaily(s: GameState, now: number): Out<DailyReward | null> {
  if (!dailyAvailable(s, now)) return { state: s, result: null };
  const today = dayKey(now);
  const last = s.daily.lastClaimDay;
  const streak = last && daysBetween(last, today) === 1 ? s.streak.count + 1 : 1;
  const reward = dailyReward(streak);
  const w = withWallet(s, reward);
  let next: GameState = {
    ...w.state,
    xp: s.xp + 10,
    streak: { count: streak, best: Math.max(s.streak.best, streak) },
    daily: { lastClaimDay: today, lastSeen: Math.max(s.daily.lastSeen, now) },
  };
  const r = settleRewards(s, next, now);
  next = r.state;
  if (streak >= 2) next = push(next, { kind: 'streak', icon: '🔥', eyebrowKey: 'banner_streak', titleKey: 'banner_streak_days', titleParams: { n: streak } });
  return { state: next, result: { reward: w.applied, streak, xp: 10 } };
}

export function touchClock(s: GameState, now: number): GameState {
  return now > s.daily.lastSeen ? { ...s, daily: { ...s.daily, lastSeen: now } } : s;
}

/* ---------- Recharge de secours, réinitialisations, réglages ---------- */

export const refillAvailable = (s: GameState, now: number): boolean => s.balance <= ECONOMY.REFILL_THRESHOLD && s.refillDay !== dayKey(now);

export function refill(s: GameState, now: number): Out<boolean> {
  if (!refillAvailable(s, now)) return { state: s, result: false };
  const w = withWallet({ ...s, refillDay: dayKey(now) }, ECONOMY.REFILL_TO - s.balance);
  return { state: w.state, result: true };
}

export const resetCapital = (s: GameState): GameState => ({ ...s, balance: ECONOMY.START_BALANCE, walletEvent: null });

export const resetAll = (s: GameState): GameState => ({ ...initialState(), ready: true, settings: s.settings });

export const toggleChecklist = (s: GameState, id: number): GameState => ({
  ...s,
  checklist: s.checklist.includes(id) ? s.checklist.filter((x) => x !== id) : [...s.checklist, id],
});

export const dismissBanner = (s: GameState, id: number): GameState => ({ ...s, queue: s.queue.filter((b) => b.id !== id) });

/* ---------- Niveaux : déblocage ---------- */

export function isUnlocked(s: Persisted, levelId: number, recommended: number): boolean {
  return levelId === 1 || levelId === recommended || (s.levels[levelId - 1]?.stars ?? 0) >= 1;
}

/* ---------- Persistance : fusion défensive + migration de l'ancienne version ---------- */

export function sanitize(raw: unknown): Persisted {
  const d = defaultPersisted();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<Persisted>;
  const num = (v: unknown, fb: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fb);
  return {
    v: 2,
    balance: Math.max(0, num(r.balance, d.balance)),
    xp: Math.max(0, num(r.xp, 0)),
    choice: r.choice === 'debutant' || r.choice === 'intermediaire' || r.choice === 'avance' ? r.choice : null,
    levels: r.levels && typeof r.levels === 'object' ? (r.levels as Record<number, LevelProgress>) : {},
    streak: { count: num(r.streak?.count, 0), best: num(r.streak?.best, 0) },
    daily: { lastClaimDay: typeof r.daily?.lastClaimDay === 'string' ? r.daily.lastClaimDay : null, lastSeen: num(r.daily?.lastSeen, 0) },
    refillDay: typeof r.refillDay === 'string' ? r.refillDay : null,
    achievements: r.achievements && typeof r.achievements === 'object' ? r.achievements : {},
    stats: { ...d.stats, ...(r.stats ?? {}) },
    settings: {
      sound: r.settings?.sound !== false,
      haptics: r.settings?.haptics !== false,
      lang: r.settings?.lang === 'fr' || r.settings?.lang === 'en' || r.settings?.lang === 'es' ? r.settings.lang : 'auto',
    },
    seenTour: !!r.seenTour,
    checklist: Array.isArray(r.checklist) ? r.checklist.filter((x): x is number => typeof x === 'number') : [],
  };
}

export interface LegacyData { balance?: string | null; completed?: string | null; tour?: string | null; checklist?: string | null }

/** Reprend la progression de l'ancienne version (clés AsyncStorage séparées). */
export function migrateLegacy(l: LegacyData): Persisted | null {
  const has = l.balance != null || l.completed != null || l.checklist != null || l.tour != null;
  if (!has) return null;
  const d = defaultPersisted();
  const parse = <T,>(v: string | null | undefined, fb: T): T => {
    try { return v ? (JSON.parse(v) as T) : fb; } catch { return fb; }
  };
  const legacyBalance = parseFloat(l.balance ?? '');
  const done = parse<number[]>(l.completed, []).filter((x) => typeof x === 'number');
  const levels: Record<number, LevelProgress> = {};
  done.forEach((id) => { levels[id] = { stars: 1, best: 1, plays: 1, passes: 1 }; });
  return {
    ...d,
    balance: Number.isFinite(legacyBalance) ? Math.max(ECONOMY.START_BALANCE, Math.min(legacyBalance, 1000)) : d.balance,
    levels,
    seenTour: l.tour === '1',
    checklist: parse<number[]>(l.checklist, []).filter((x) => typeof x === 'number'),
  };
}

export const toPersisted = (s: GameState): Persisted => {
  const { ready: _r, queue: _q, walletEvent: _w, nextId: _n, ...p } = s;
  return p;
};
