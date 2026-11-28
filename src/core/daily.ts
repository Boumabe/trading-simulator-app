import { LEVELS, type LevelDef } from './data/levels';
import { SCENARIOS } from './data/scenarios';
import { dictionary } from './i18n/dictionary';
import { hashString, mulberry32, shuffled } from './engine/rng';
import { daysBetween } from './store/logic';
import type { Lang, ScenarioConfig } from './types';

/**
 * Défi du jour : un graphique par jour, le MÊME pour tous les joueurs, une seule validation par jour, noté sur la discipline (jamais sur l'argent).
 * Pourquoi ces choix : une seule partie par jour crée de la rareté et un rendez-vous ; le même graphique pour tous crée une conversation ;
 * un résultat partageable sans spoiler en fait un moyen de se montrer (c'est le mécanisme de Wordle). Une série indulgente (1 jour de grâce)
 * garde l'habitude sans punir un oubli (Chess.com : 48 h ; Duolingo : série plus facile = meilleure rétention).
 */

/** Premier défi (n°1). */
export const DAILY_EPOCH = '2026-12-01';
/** Écart maximal (en jours) entre deux défis pour que la série continue : 2 = on peut manquer un jour. */
export const DAILY_GRACE_DAYS = 2;
export const DAILY_MAX_MARKS = 8;
export const DAILY_MILESTONES = [3, 7, 14, 30] as const;
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.boumabe.simtra';
export const DAILY_REMINDER_HOUR = 19;

export interface DailyDone { key: string; discipline: number; marks: string; trades: number }
export interface DailyState {
  streak: number;
  best: number;
  /** Nombre total de défis validés. */
  plays: number;
  /** Dernier jour validé (AAAA-MM-JJ). */
  lastKey: string | null;
  /** Défi du jour commencé : le 1er trade a été ouvert (il est alors compté, même si on quitte). */
  started: string | null;
  today: DailyDone | null;
  /** 14 derniers défis validés (pour le calendrier de la semaine). */
  recent: { key: string; d: number }[];
  /** Dernier jour où la carte a été vue (mesure : une fois par jour). */
  viewKey: string | null;
  /** Rappel quotidien activé par le joueur. */
  remind: boolean;
}

export const initialDaily = (): DailyState => ({ streak: 0, best: 0, plays: 0, lastKey: null, started: null, today: null, recent: [], viewKey: null, remind: false });

/* ---------- Numéro et choix du niveau ---------- */

export const dailyNumber = (key: string): number => Math.max(1, daysBetween(DAILY_EPOCH, key) + 1);

/** Niveaux jouables dans le défi : tous les niveaux « jeu » qui ont un scénario. */
export const DAILY_POOL: LevelDef[] = LEVELS.filter((l) => l.kind === 'play' && !!l.strategyId && !!SCENARIOS[l.strategyId]);

function cycleOrder(cycle: number): number[] {
  return shuffled(DAILY_POOL.map((_, i) => i), hashString(`daily-cycle-${cycle}`));
}

/**
 * Niveau du jour : chaque niveau sort une fois par cycle (ordre mélangé, identique pour tous), et jamais deux jours de suite
 * (on évite la répétition à la jonction de deux cycles).
 */
export function pickDaily(key: string): { level: LevelDef; number: number } {
  const number = dailyNumber(key);
  const len = DAILY_POOL.length;
  const cycle = Math.floor((number - 1) / len);
  const order = cycleOrder(cycle);
  if (cycle > 0 && order[0] === cycleOrder(cycle - 1)[len - 1]) [order[0], order[1]] = [order[1], order[0]];
  return { level: DAILY_POOL[order[(number - 1) % len]], number };
}

/**
 * Variante du graphique : tous les prix sont multipliés par un coefficient (0,9 à 1,15) et le bruit des bougies change.
 * Même motif, mêmes règles, mais on ne peut pas reconnaître « la zone à 99,2 » d'un jour à l'autre.
 */
export function variantFor(level: LevelDef, key: string): { id: string; cfg: ScenarioConfig; factor: number } {
  const base = SCENARIOS[level.strategyId!];
  const f = Math.round((0.9 + mulberry32(hashString(`daily-scale-${key}-${level.id}`))() * 0.25) * 1000) / 1000;
  const r = (x: number) => Math.round(x * f * 100) / 100;
  const cfg: ScenarioConfig = {
    ...base,
    candles: base.candles.map((c) => ({ ...c, path: c.path.map(r) })),
    zones: base.zones?.map((z) => ({ ...z, low: r(z.low), high: r(z.high) })),
    fiboLevels: base.fiboLevels?.map((l) => ({ ...l, price: r(l.price) })),
    trendAnchors: base.trendAnchors?.map((a) => ({ ...a, price: r(a.price) })) as ScenarioConfig['trendAnchors'],
    tolerance: base.tolerance === undefined ? undefined : r(base.tolerance),
  };
  return { id: `daily-${key}-${level.strategyId}`, cfg, factor: f };
}

/* ---------- État du jour, série ---------- */

/** Le défi s'ouvre après le premier niveau réussi pour un débutant (il doit connaître les bases). */
export function dailyUnlocked(s: { choice: string | null; levels: Record<number, { stars?: number }> }): boolean {
  return s.choice !== 'debutant' || (s.levels[1]?.stars ?? 0) >= 1;
}

export type DailyStatus = 'locked' | 'ready' | 'done';
export function dailyStatus(daily: DailyState, key: string, unlocked: boolean): DailyStatus {
  if (daily.today?.key === key) return 'done';
  return unlocked ? 'ready' : 'locked';
}

/** Série affichée : vivante tant qu'on n'a pas laissé passer plus d'un jour (grâce comprise). */
export function liveDailyStreak(daily: DailyState, key: string): number {
  if (!daily.lastKey) return 0;
  return daysBetween(daily.lastKey, key) <= DAILY_GRACE_DAYS ? daily.streak : 0;
}

/** La série ne tient plus qu'à un fil : hier a été manqué, il faut jouer aujourd'hui. */
export const dailyStreakAtRisk = (daily: DailyState, key: string): boolean =>
  !!daily.lastKey && daily.streak > 0 && daily.today?.key !== key && daysBetween(daily.lastKey, key) === DAILY_GRACE_DAYS;

export function finishDailyState(
  daily: DailyState,
  a: { key: string; discipline: number; marks: string; trades: number },
): { daily: DailyState; streak: number; milestone: number | null; first: boolean } {
  if (daily.today?.key === a.key) return { daily, streak: daily.streak, milestone: null, first: false }; // déjà validé aujourd'hui
  const gap = daily.lastKey ? daysBetween(daily.lastKey, a.key) : null;
  const streak = gap !== null && gap > 0 && gap <= DAILY_GRACE_DAYS ? daily.streak + 1 : 1;
  const next: DailyState = {
    ...daily,
    streak,
    best: Math.max(daily.best, streak),
    plays: daily.plays + 1,
    lastKey: a.key,
    started: a.key,
    today: { key: a.key, discipline: Math.round(a.discipline), marks: a.marks, trades: a.trades },
    recent: [...daily.recent.filter((r) => r.key !== a.key), { key: a.key, d: Math.round(a.discipline) }].slice(-14),
  };
  const milestone = (DAILY_MILESTONES as readonly number[]).includes(streak) ? streak : null;
  return { daily: next, streak, milestone, first: daily.plays === 0 };
}

/* ---------- Résultat partageable (sans spoiler) ---------- */

export function marksFrom(trades: { compliant: boolean }[]): string {
  return trades.slice(0, DAILY_MAX_MARKS).map((t) => (t.compliant ? 'G' : 'R')).join('');
}
export const marksToSquares = (marks: string): string => marks.split('').map((m) => (m === 'G' ? '🟩' : '🟥')).join('');

export function shareText(lang: Lang, a: { number: number; marks: string; discipline: number; streak: number }): string {
  const d = dictionary[lang];
  const fill = (k: string, p: Record<string, string | number>) => Object.keys(p).reduce((s, key) => s.split(`{${key}}`).join(String(p[key])), d[k]);
  const streakLine = a.streak >= 2 ? ` · ${fill('daily_share_streak', { n: a.streak })}` : '';
  return `${fill('daily_share_head', { n: a.number })}\n${marksToSquares(a.marks)}\n${fill('daily_share_disc', { d: a.discipline })}${streakLine}\n${d.daily_share_cta}\n${PLAY_URL}`;
}

/* ---------- Compte à rebours jusqu'au prochain défi (minuit local) ---------- */

export function msUntilNextDaily(now: number): number {
  const d = new Date(now);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0).getTime();
  return next - now;
}
export function countdownParts(ms: number): { h: number; m: number } {
  const total = Math.max(0, Math.ceil(ms / 60000));
  return { h: Math.floor(total / 60), m: total % 60 };
}

/** Jours de la semaine pour le calendrier : les 7 derniers jours, du plus ancien à aujourd'hui. */
export function weekDots(daily: DailyState, key: string): { key: string; done: boolean; today: boolean }[] {
  const [y, m, d] = key.split('-').map(Number);
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(Date.UTC(y, m - 1, d - i));
    const k = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
    out.push({ key: k, done: daily.recent.some((r) => r.key === k), today: i === 0 });
  }
  return out;
}

/** Ce qu'il faut pour jouer le défi du jour dans l'écran de jeu. */
export interface DailyPlay { key: string; number: number; id: string; cfg: ScenarioConfig }
