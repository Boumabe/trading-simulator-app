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
  /**
   * Bougies d'historique générées avant le scénario : le graphique s'ouvre avec elles déjà dessinées,
   * pour que les indicateurs (RSI, stochastique, bandes…) soient déjà en place et qu'on les voie évoluer.
   */
  lead?: number;
  /** Pente par bougie de l'historique (par défaut : 60 % de la pente des deux premières bougies du scénario). */
  leadDrift?: number;
  /**
   * Nombre de bougies (du scénario, hors historique) après lequel la zone / les niveaux apparaissent : on les trace une fois le motif formé.
   * Avant : rien d'affiché, et une entrée n'est jamais conforme (« trop tôt »). Absent = visible dès le départ.
   */
  zoneFrom?: number;
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
