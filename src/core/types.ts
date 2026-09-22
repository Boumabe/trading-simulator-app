export type Dir = 'buy' | 'sell';
export type Lang = 'fr' | 'en' | 'es';
export type LangSetting = Lang | 'auto';
export type Mode = 'zone' | 'pattern' | 'indicator' | 'band' | 'ma' | 'vwap' | 'trendzone' | 'timewindow';

export interface RawCandle {
  path: number[];
  touch?: boolean;
  pattern?: boolean;
  vol?: number;
}
export interface Zone { low: number; high: number; direction: Dir }
export interface Anchor { idx: number; price: number }
export interface FiboLevel { price: number; pct: string; highlight?: boolean }

export interface ScenarioConfig {
  label?: string;
  mode: Mode;
  candles: RawCandle[];
  zones?: Zone[];
  touchesRequired?: number;
  fiboLevels?: FiboLevel[];
  patternName?: string;
  patternDirection?: Dir;
  showVolume?: boolean;
  windowCandles?: number;
  direction?: Dir;
  indicator?: 'rsi' | 'macd' | 'stoch';
  period?: number;
  dPeriod?: number;
  oversold?: number;
  overbought?: number;
  shortPeriod?: number;
  longPeriod?: number;
  signalPeriod?: number;
  stdMult?: number;
  tolerance?: number;
  trendAnchors?: [Anchor, Anchor];
  timewindowType?: 'favor' | 'avoid';
  windowRange?: [number, number];
}

export type L10n = Record<Lang, string>;
export interface BookItem {
  id: string;
  tier?: number;
  diagram?: string;
  title: L10n;
  def: L10n;
  points?: Record<Lang, string[]>;
}
export interface QuizQuestion {
  prompt: string;
  visual?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
export type QuizData = Record<string, Partial<Record<Lang, QuizQuestion[]>>>;
