import { SESSION } from '../constants';
import type { Anchor, Dir, ScenarioConfig, Zone } from '../types';
import { bollinger, emaSeries, macd, rsiSeries, stochastic, vwap, type Num } from './indicators';
import { hashString, mulberry32 } from './rng';

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  touch: boolean;
  pattern: boolean;
  vol?: number;
}

/** Fenêtre pendant laquelle une entrée est conforme (en nombre de bougies clôturées). */
export interface Signal {
  start: number;
  end: number;
  markIdx: number | null;
  dir: Dir;
}

export interface Series {
  a?: Num[];
  b?: Num[];
  sma?: Num[];
  upper?: Num[];
  lower?: Num[];
}

export interface Runtime {
  id: string;
  cfg: ScenarioConfig;
  n: number;
  candles: Candle[];
  /** Prix tick par tick de chaque bougie (déterministes). */
  ticks: number[][];
  priceMin: number;
  priceMax: number;
  signals: Signal[];
  series: Series;
  /** touchPrefix[k] = nombre de bougies « touch » parmi les k premières. */
  touchPrefix: number[];
  cutCount: number;
  sniperEligible: boolean;
  touchesRequired: number;
  windowCandles: number;
  dir: Dir;
}

export function pathPrice(path: number[], frac: number): number {
  const segs = path.length - 1;
  const scaled = Math.min(frac, 1) * segs;
  const segIdx = Math.min(Math.floor(scaled), segs - 1);
  const a = path[segIdx];
  const b = path[segIdx + 1];
  return a + (b - a) * (scaled - segIdx);
}

const round = (v: number) => Math.round(v * 1000) / 1000;

function buildTicks(id: string, idx: number, path: number[]): number[] {
  const rnd = mulberry32(hashString(id) + idx * 7919);
  const N = SESSION.TICKS_PER_CANDLE;
  const out: number[] = [];
  let vel = 0;
  for (let k = 0; k < N; k++) {
    const target = pathPrice(path, (k + 1) / N);
    const burst = rnd() < 0.04 ? 3 : 1;
    vel = vel * 0.82 + (rnd() - 0.5) * 0.22 * burst;
    out.push(round(target + vel));
  }
  out[N - 1] = path[path.length - 1];
  return out;
}

export function trendLine(anchors: [Anchor, Anchor], idx: number, tol: number) {
  const [a, b] = anchors;
  const slope = (b.price - a.price) / (b.idx - a.idx);
  const expected = a.price + slope * (idx - a.idx);
  return { low: expected - tol, high: expected + tol, mid: expected };
}

function computeSignals(cfg: ScenarioConfig, candles: Candle[], series: Series): Signal[] {
  const n = candles.length;
  const w = cfg.windowCandles ?? 3;
  const out: Signal[] = [];
  const push = (i: number, dir: Dir, mark: number | null = i) => out.push({ start: i + 1, end: i + 1 + w, markIdx: mark, dir });
  const closes = candles.map((c) => c.close);

  if (cfg.mode === 'pattern') {
    candles.forEach((c, i) => c.pattern && push(i, cfg.patternDirection ?? 'buy'));
  } else if (cfg.mode === 'indicator') {
    const dir = cfg.direction ?? 'buy';
    if (cfg.indicator === 'macd') {
      const { macdLine, signalLine } = macd(closes, cfg.shortPeriod ?? 3, cfg.longPeriod ?? 6, cfg.signalPeriod ?? 3);
      series.a = macdLine;
      series.b = signalLine;
      for (let i = 1; i < n; i++) {
        const prev = macdLine[i - 1] - signalLine[i - 1];
        const cur = macdLine[i] - signalLine[i];
        if ((dir === 'buy' && prev < 0 && cur >= 0) || (dir === 'sell' && prev > 0 && cur <= 0)) push(i, dir, null);
      }
    } else if (cfg.indicator === 'stoch') {
      const { k, d } = stochastic(candles, cfg.period ?? 6, cfg.dPeriod ?? 3);
      series.a = k;
      series.b = d;
      for (let i = 1; i < n; i++) {
        const [k0, k1, d0, d1] = [k[i - 1], k[i], d[i - 1], d[i]];
        if (k0 === null || k1 === null || d0 === null || d1 === null) continue;
        if ((dir === 'buy' && k0 - d0 < 0 && k1 - d1 >= 0 && k1 < 50) || (dir === 'sell' && k0 - d0 > 0 && k1 - d1 <= 0 && k1 > 50)) push(i, dir, null);
      }
    } else {
      const rsi = rsiSeries(closes, cfg.period ?? 6);
      series.a = rsi;
      const os = cfg.oversold ?? 30;
      const ob = cfg.overbought ?? 70;
      for (let i = 1; i < n; i++) {
        const p = rsi[i - 1];
        const v = rsi[i];
        if (p === null || v === null) continue;
        if ((dir === 'buy' && p < os && v >= os) || (dir === 'sell' && p > ob && v <= ob)) push(i, dir, null);
      }
    }
  } else if (cfg.mode === 'band') {
    const dir = cfg.direction ?? 'buy';
    const bb = bollinger(closes, cfg.period ?? 6, cfg.stdMult ?? 2);
    series.sma = bb.sma;
    series.upper = bb.upper;
    series.lower = bb.lower;
    candles.forEach((c, i) => {
      const lo = bb.lower[i];
      const up = bb.upper[i];
      if (lo === null || up === null) return;
      if ((dir === 'buy' && c.low <= lo && c.close > lo) || (dir === 'sell' && c.high >= up && c.close < up)) push(i, dir);
    });
  } else if (cfg.mode === 'ma') {
    const dir = cfg.direction ?? 'buy';
    const s = emaSeries(closes, cfg.shortPeriod ?? 3);
    const l = emaSeries(closes, cfg.longPeriod ?? 6);
    series.a = s;
    series.b = l;
    for (let i = 1; i < n; i++) {
      const prev = s[i - 1] - l[i - 1];
      const cur = s[i] - l[i];
      if ((dir === 'buy' && prev < 0 && cur >= 0) || (dir === 'sell' && prev > 0 && cur <= 0)) push(i, dir, null);
    }
  } else if (cfg.mode === 'vwap') {
    const dir = cfg.direction ?? 'buy';
    const v = vwap(candles);
    series.a = v;
    candles.forEach((c, i) => {
      if ((dir === 'buy' && c.low <= v[i] && c.close > v[i]) || (dir === 'sell' && c.high >= v[i] && c.close < v[i])) push(i, dir);
    });
  }
  return out;
}

export function compile(id: string, cfg: ScenarioConfig): Runtime {
  const ticks = cfg.candles.map((c, i) => buildTicks(id, i, c.path));
  const candles: Candle[] = cfg.candles.map((c, i) => {
    const open = c.path[0];
    const close = c.path[c.path.length - 1];
    return {
      open,
      close,
      high: round(Math.max(open, ...ticks[i])),
      low: round(Math.min(open, ...ticks[i])),
      touch: !!c.touch,
      pattern: !!c.pattern,
      vol: c.vol,
    };
  });
  const series: Series = {};
  const signals = computeSignals(cfg, candles, series);
  const touchPrefix = [0];
  candles.forEach((c) => touchPrefix.push(touchPrefix[touchPrefix.length - 1] + (c.touch ? 1 : 0)));
  const n = candles.length;
  const zones: Zone[] = cfg.zones ?? [];
  return {
    id,
    cfg,
    n,
    candles,
    ticks,
    priceMin: Math.min(...candles.map((c) => c.low)) - 1.2,
    priceMax: Math.max(...candles.map((c) => c.high)) + 1.2,
    signals,
    series,
    touchPrefix,
    cutCount: Math.max(3, Math.min(SESSION.WINDOW_SIZE, Math.floor(n * 0.25))),
    sniperEligible: (cfg.mode === 'zone' && zones.length === 1) || cfg.mode === 'trendzone',
    touchesRequired: cfg.touchesRequired ?? 1,
    windowCandles: cfg.windowCandles ?? 3,
    dir: cfg.patternDirection ?? cfg.direction ?? 'buy',
  };
}
