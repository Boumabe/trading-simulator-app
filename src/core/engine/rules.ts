import { ECONOMY, SESSION } from '../constants';
import type { Anchor, Dir, Zone } from '../types';
import { trendLine, type Runtime } from './scenario';

export type ReasonKey =
  | 'ok_zone' | 'ok_signal' | 'ok_line' | 'ok_window' | 'ok_avoid'
  | 'wrong_side' | 'out_zone' | 'unconfirmed' | 'too_early' | 'too_late'
  | 'off_line' | 'out_window' | 'in_avoid';

export interface RuleOpts {
  playerZone?: Zone | null;
  playerAnchors?: [Anchor, Anchor] | null;
}

export interface Position {
  type: Dir;
  entryPrice: number;
  entryClosed: number;
  /** Verdict de l'entrée, connu dès l'ouverture (retour immédiat au joueur). */
  compliant: boolean;
  reason: ReasonKey;
}

export interface TradeResult {
  type: Dir;
  entryPrice: number;
  exitPrice: number;
  entryClosed: number;
  exitClosed: number;
  pnl: number;
  compliant: boolean;
  reason: ReasonKey;
  net: number;
}

export interface Entry { type: Dir; price: number; closed: number }
export interface Verdict { compliant: boolean; reason: ReasonKey }

const round2 = (v: number) => Math.round(v * 100) / 100;
export { round2 };

export function activeZones(rt: Runtime, opts: RuleOpts = {}): Zone[] {
  if (opts.playerZone) return [opts.playerZone];
  return rt.cfg.zones ?? [];
}

export function activeAnchors(rt: Runtime, opts: RuleOpts = {}): [Anchor, Anchor] {
  return opts.playerAnchors ?? rt.cfg.trendAnchors ?? [{ idx: 0, price: 0 }, { idx: 1, price: 0 }];
}

export function trendBandAt(rt: Runtime, idx: number, opts: RuleOpts = {}) {
  return trendLine(activeAnchors(rt, opts), idx, rt.cfg.tolerance ?? 1.5);
}

export function inWindowRange(rt: Runtime, closed: number): boolean {
  const r = rt.cfg.windowRange;
  return !!r && closed >= r[0] && closed <= r[1];
}

/** Une entrée maintenant serait-elle conforme ? Fonction pure, testée. */
export function entryStatus(rt: Runtime, e: Entry, opts: RuleOpts = {}): Verdict {
  const cfg = rt.cfg;
  const closed = Math.min(e.closed, rt.n);
  const tol = SESSION.ZONE_TOL;

  switch (cfg.mode) {
    case 'zone': {
      const z = activeZones(rt, opts).find((zz) => e.price >= zz.low - tol && e.price <= zz.high + tol);
      if (!z) return { compliant: false, reason: 'out_zone' };
      if (z.direction !== e.type) return { compliant: false, reason: 'wrong_side' };
      if (rt.touchPrefix[closed] < rt.touchesRequired - 1) return { compliant: false, reason: 'unconfirmed' };
      return { compliant: true, reason: 'ok_zone' };
    }
    case 'trendzone': {
      if (e.type !== (cfg.direction ?? 'buy')) return { compliant: false, reason: 'wrong_side' };
      const b = trendBandAt(rt, closed, opts);
      const ok = e.price >= b.low - tol && e.price <= b.high + tol;
      return ok ? { compliant: true, reason: 'ok_line' } : { compliant: false, reason: 'off_line' };
    }
    case 'timewindow': {
      const inWin = inWindowRange(rt, closed);
      if (cfg.timewindowType === 'avoid') {
        return inWin ? { compliant: false, reason: 'in_avoid' } : { compliant: true, reason: 'ok_avoid' };
      }
      if (!inWin) return { compliant: false, reason: 'out_window' };
      if (e.type !== (cfg.direction ?? 'buy')) return { compliant: false, reason: 'wrong_side' };
      return { compliant: true, reason: 'ok_window' };
    }
    default: {
      const live = rt.signals.filter((s) => closed >= s.start && closed <= s.end);
      if (live.length) {
        return live.some((s) => s.dir === e.type) ? { compliant: true, reason: 'ok_signal' } : { compliant: false, reason: 'wrong_side' };
      }
      const first = rt.signals.length ? Math.min(...rt.signals.map((s) => s.start)) : Infinity;
      return { compliant: false, reason: closed < first ? 'too_early' : 'too_late' };
    }
  }
}

/** Vrai si acheter OU vendre maintenant serait conforme (sert au « verrouillage » de la cible). */
export function lockedNow(rt: Runtime, price: number, closed: number, opts: RuleOpts = {}): boolean {
  return (['buy', 'sell'] as const).some((type) => entryStatus(rt, { type, price, closed }, opts).compliant);
}

export function openPosition(rt: Runtime, type: Dir, price: number, closed: number, opts: RuleOpts = {}): Position {
  const v = entryStatus(rt, { type, price, closed }, opts);
  return { type, entryPrice: price, entryClosed: closed, compliant: v.compliant, reason: v.reason };
}

export function settle(rt: Runtime, pos: Position, exitPrice: number, exitClosed: number): TradeResult {
  const dir = pos.type === 'buy' ? 1 : -1;
  const pnl = round2((exitPrice - pos.entryPrice) * dir * ECONOMY.POINT_VALUE);
  let compliant = pos.compliant;
  let reason = pos.reason;
  // « Éviter la fenêtre » : on juge sur toute la durée de la position, pas seulement l'entrée.
  if (rt.cfg.mode === 'timewindow' && rt.cfg.timewindowType === 'avoid' && rt.cfg.windowRange) {
    const [a, b] = rt.cfg.windowRange;
    const overlap = !(exitClosed < a || pos.entryClosed > b);
    compliant = !overlap;
    reason = overlap ? 'in_avoid' : 'ok_avoid';
  }
  const net = round2(pnl + (compliant ? ECONOMY.COMPLIANT_BONUS : -ECONOMY.PENALTY));
  return { type: pos.type, entryPrice: pos.entryPrice, exitPrice, entryClosed: pos.entryClosed, exitClosed, pnl, compliant, reason, net };
}

/** Précision d'une zone dessinée par le joueur (0..1) : recouvrement et taille raisonnable. */
export function zoneAccuracy(player: { low: number; high: number }, real: { low: number; high: number }): number {
  const overlap = Math.max(0, Math.min(player.high, real.high) - Math.max(player.low, real.low));
  const union = Math.max(player.high, real.high) - Math.min(player.low, real.low);
  return union <= 0 ? 0 : overlap / union;
}

/** Précision d'une ligne de tendance dessinée (0..1) sur les bougies visibles. */
export function lineAccuracy(rt: Runtime, player: [Anchor, Anchor]): number {
  const real = rt.cfg.trendAnchors;
  if (!real) return 0;
  const tol = rt.cfg.tolerance ?? 1.5;
  let worst = 0;
  for (let i = 0; i < rt.cutCount; i++) {
    const d = Math.abs(trendLine(player, i, 0).mid - trendLine(real, i, 0).mid);
    worst = Math.max(worst, d);
  }
  return Math.max(0, 1 - worst / (tol * 3));
}

export const SNIPER_MIN_ACCURACY = 0.5;
