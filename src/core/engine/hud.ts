import { activeZones, inWindowRange, lockedNow, trendBandAt, type RuleOpts } from './rules';
import type { Runtime } from './scenario';
import { currentPrice, type SessionState } from './session';

export interface Hud {
  /** Clé i18n du libellé, ou texte brut (indicateurs). */
  key?: string;
  text?: string;
  locked: boolean;
  /** Vrai quand une fenêtre de signal est ouverte (pastille dorée). */
  windowOpen: boolean;
}

const KEYS = {
  pattern: ['hud_pattern_none', 'hud_pattern_active', 'hud_window_closed'],
  vwap: ['hud_no_vwap_touch', 'hud_vwap_touch', 'hud_window_closed'],
  ma: ['hud_no_cross', 'hud_cross_active', 'hud_window_closed'],
  band: ['hud_no_band_touch', 'hud_band_touch', 'hud_window_closed'],
} as const;

const f0 = (v: number | null | undefined, d = 0) => (v == null ? '—' : v.toFixed(d));

export function hudState(rt: Runtime, s: SessionState, opts: RuleOpts = {}): Hud {
  const price = currentPrice(rt, s);
  const closed = Math.min(s.closed, rt.n);
  const locked = lockedNow(rt, price, closed, opts);
  const cfg = rt.cfg;
  const last = Math.max(0, closed - 1);

  if (cfg.mode === 'zone') {
    const inside = activeZones(rt, opts).some((z) => price >= z.low && price <= z.high);
    const forming = s.closed < rt.n && rt.candles[s.closed].touch && inside ? 1 : 0;
    const total = rt.touchPrefix[rt.n];
    const seen = Math.min(total, rt.touchPrefix[closed] + forming);
    return { key: 'hud_touches', text: `${seen}/${rt.touchesRequired}`, locked, windowOpen: inside };
  }
  if (cfg.mode === 'trendzone') {
    const b = trendBandAt(rt, closed, opts);
    const on = price >= b.low && price <= b.high;
    return { key: on ? 'hud_on_line' : 'hud_off_line', locked, windowOpen: on };
  }
  if (cfg.mode === 'timewindow') {
    const inWin = inWindowRange(rt, closed);
    const avoid = cfg.timewindowType === 'avoid';
    return { key: avoid ? (inWin ? 'hud_avoid_window' : 'hud_out_window') : inWin ? 'hud_favor_window' : 'hud_out_window', locked, windowOpen: inWin };
  }
  if (cfg.mode === 'indicator') {
    const a = rt.series.a?.[last] ?? null;
    const b = rt.series.b?.[last] ?? null;
    const windowOpen = rt.signals.some((x) => closed >= x.start && closed <= x.end);
    if (closed === 0) return { text: '—', locked, windowOpen };
    if (cfg.indicator === 'macd') return { text: `MACD ${a == null || b == null ? '—' : (a - b).toFixed(2)}`, locked, windowOpen };
    if (cfg.indicator === 'stoch') return { text: `%K ${f0(a)}`, locked, windowOpen };
    return { text: `RSI ${f0(a)}`, locked, windowOpen };
  }
  const set = KEYS[cfg.mode === 'pattern' ? 'pattern' : cfg.mode === 'vwap' ? 'vwap' : cfg.mode === 'ma' ? 'ma' : 'band'];
  const windowOpen = rt.signals.some((x) => closed >= x.start && closed <= x.end);
  const started = rt.signals.some((x) => closed >= x.start);
  return { key: !started ? set[0] : windowOpen ? set[1] : set[2], locked, windowOpen };
}

