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
      return t(rt.zoneFrom > 0 ? 'rule_trendzone_formed' : 'rule_trendzone', { action: action(dir) });
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
      const k = rt.touchesRequired;
      const formed = rt.zoneFrom > 0;
      if (zones.length > 1) return formed ? t('rule_zone_formed_multi') : k >= 2 ? t('rule_zone_multi', { n: k }) : t('rule_zone_multi_1');
      const d = zones[0]?.direction ?? 'buy';
      const p = { action: action(d), side: t(d === 'buy' ? 'side_below' : 'side_above') };
      return formed ? t('rule_zone_formed', p) : k >= 2 ? t('rule_zone_single', { ...p, n: k }) : t('rule_zone_single_1', p);
    }
  }
}
