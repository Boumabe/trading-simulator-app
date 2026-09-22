import { SESSION } from '../constants';
import { openPosition, settle, type Position, type ReasonKey, type RuleOpts, type TradeResult, type Verdict } from './rules';
import type { Runtime } from './scenario';
import type { Dir } from '../types';
import { disciplinePct } from './scoring';

export type SessionEvent =
  | { type: 'candle'; idx: number; touch: boolean; pattern: boolean }
  | { type: 'open'; verdict: Verdict }
  | { type: 'trade'; trade: TradeResult; combo: number }
  | { type: 'ended' };

export interface SessionState {
  status: 'idle' | 'running' | 'paused' | 'ended';
  closed: number;
  tick: number;
  position: Position | null;
  trades: TradeResult[];
  combo: number;
  bestCombo: number;
  events: SessionEvent[];
}

export type SessionAction =
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'tick' }
  | { type: 'open'; side: Dir; opts?: RuleOpts }
  | { type: 'close' }
  | { type: 'reset' };

export const initSession = (): SessionState => ({
  status: 'idle', closed: 0, tick: 0, position: null, trades: [], combo: 0, bestCombo: 0, events: [],
});

export function currentPrice(rt: Runtime, s: SessionState): number {
  if (s.closed >= rt.n) return rt.candles[rt.n - 1].close;
  return rt.ticks[s.closed][s.tick];
}

export function formingCandle(rt: Runtime, s: SessionState) {
  if (s.closed >= rt.n) return null;
  const open = rt.candles[s.closed].open;
  let high = open;
  let low = open;
  const t = rt.ticks[s.closed];
  for (let i = 0; i <= s.tick; i++) {
    if (t[i] > high) high = t[i];
    if (t[i] < low) low = t[i];
  }
  return { open, high, low, close: t[s.tick] };
}

function closeAt(rt: Runtime, s: SessionState, price: number, closed: number): SessionState {
  if (!s.position) return s;
  const trade = settle(rt, s.position, price, closed);
  const combo = trade.compliant ? s.combo + 1 : 0;
  return {
    ...s,
    position: null,
    trades: [...s.trades, trade],
    combo,
    bestCombo: Math.max(s.bestCombo, combo),
    events: [...s.events, { type: 'trade', trade, combo }],
  };
}

export const makeReducer = (rt: Runtime) => (s: SessionState, a: SessionAction): SessionState => {
  switch (a.type) {
    case 'start':
      return s.status === 'idle' ? { ...s, status: 'running' } : s;
    case 'pause':
      return s.status === 'running' ? { ...s, status: 'paused' } : s;
    case 'resume':
      return s.status === 'paused' ? { ...s, status: 'running' } : s;
    case 'reset':
      return initSession();
    case 'open': {
      if (s.status !== 'running' || s.position) return s;
      const pos = openPosition(rt, a.side, currentPrice(rt, s), s.closed, a.opts);
      return { ...s, position: pos, events: [...s.events, { type: 'open', verdict: { compliant: pos.compliant, reason: pos.reason } }] };
    }
    case 'close': {
      if (s.status === 'idle' || s.status === 'ended') return s;
      return closeAt(rt, s, currentPrice(rt, s), s.closed);
    }
    case 'tick': {
      if (s.status !== 'running') return s;
      const nextTick = s.tick + 1;
      if (nextTick < SESSION.TICKS_PER_CANDLE) return { ...s, tick: nextTick };
      const idx = s.closed;
      const c = rt.candles[idx];
      let next: SessionState = {
        ...s,
        closed: idx + 1,
        tick: 0,
        events: [...s.events, { type: 'candle', idx, touch: c.touch, pattern: c.pattern }],
      };
      if (next.closed >= rt.n) {
        next = closeAt(rt, next, c.close, rt.n);
        next = { ...next, status: 'ended', events: [...next.events, { type: 'ended' }] };
      }
      return next;
    }
    default:
      return s;
  }
};

export function sessionStats(s: SessionState) {
  const compliant = s.trades.filter((t) => t.compliant).length;
  return {
    count: s.trades.length,
    compliant,
    discipline: disciplinePct(compliant, s.trades.length),
    net: Math.round(s.trades.reduce((sum, t) => sum + t.net, 0) * 100) / 100,
    pnl: Math.round(s.trades.reduce((sum, t) => sum + t.pnl, 0) * 100) / 100,
    bestCombo: s.bestCombo,
  };
}

export type { ReasonKey };
