import type { Runtime } from './engine/scenario';
import type { Dir } from './types';

export type TFn = (key: string, params?: Record<string, string | number>) => string;

/** Phrase de règle affichée sous le graphique et dans la fiche d'infos. */
export function rulesLabel(rt: Runtime, t: TFn): string {
  const cfg = rt.cfg;
  const action = (d: Dir) => t(d === 'buy' ? 'action_buy' : 'action_sell');
  const n = rt.windowCandles;
  const dir = cfg.direction ?? 'buy';
  switch (cfg.mode) {
    case 'pattern':
      return t(cfg.showVolume ? 'rule_pattern_volume' : 'rule_pattern_generic', { action: action(cfg.patternDirection ?? 'buy'), n });
    case 'trendzone':
      return t('rule_trendzone', { action: action(dir) });
    case 'timewindow':
      return cfg.timewindowType === 'avoid' ? t('rule_timewindow_avoid') : t('rule_timewindow_favor', { action: action(dir) });
    case 'vwap':
      return t('rule_vwap', { action: action(dir), n });
    case 'ma':
      return t('rule_ma', { action: action(dir), n });
    case 'band':
      return t('rule_band', { action: action(dir), n });
    case 'indicator':
      if (cfg.indicator === 'macd') return t('rule_macd', { action: action(dir), n, trend: t(dir === 'buy' ? 'trend_bullish' : 'trend_bearish') });
      if (cfg.indicator === 'stoch') return t('rule_stoch', { action: action(dir), n, zone: t(dir === 'buy' ? 'zone_low' : 'zone_high') });
      return t('rule_rsi', { action: action(dir), n, rsizone: t(dir === 'buy' ? 'rsi_oversold' : 'rsi_overbought') });
    default: {
      const zones = cfg.zones ?? [];
      if (zones.length > 1) return t('rule_zone_multi');
      const d = zones[0]?.direction ?? 'buy';
      return t('rule_zone_single', { action: action(d), side: t(d === 'buy' ? 'side_below' : 'side_above') });
    }
  }
}
