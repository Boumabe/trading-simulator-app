export type LevelKind = 'play' | 'quiz' | 'tool';
export interface LevelDef { id: number; tier: number; kind: LevelKind; strategyId?: string; quizId?: string }

export const TIER_COUNT = 8;

export const LEVELS: LevelDef[] = [
  { id: 1, tier: 1, kind: 'play', strategyId: 'support' },
  { id: 2, tier: 1, kind: 'play', strategyId: 'resistance' },
  { id: 3, tier: 1, kind: 'play', strategyId: 'trend' },
  { id: 4, tier: 1, kind: 'play', strategyId: 'trendline' },
  { id: 5, tier: 1, kind: 'play', strategyId: 'channel' },
  { id: 6, tier: 1, kind: 'play', strategyId: 'range' },
  { id: 7, tier: 1, kind: 'play', strategyId: 'breakout' },
  { id: 8, tier: 2, kind: 'play', strategyId: 'pinbar' },
  { id: 9, tier: 2, kind: 'play', strategyId: 'engulfing' },
  { id: 10, tier: 2, kind: 'play', strategyId: 'doji' },
  { id: 11, tier: 2, kind: 'play', strategyId: 'morningstar' },
  { id: 12, tier: 2, kind: 'play', strategyId: 'insidebar' },
  { id: 13, tier: 2, kind: 'play', strategyId: 'threesoldiers' },
  { id: 14, tier: 3, kind: 'play', strategyId: 'headshoulders' },
  { id: 15, tier: 3, kind: 'play', strategyId: 'doubletop' },
  { id: 16, tier: 3, kind: 'play', strategyId: 'triangle' },
  { id: 17, tier: 3, kind: 'play', strategyId: 'flag' },
  { id: 18, tier: 3, kind: 'play', strategyId: 'wedge' },
  { id: 19, tier: 3, kind: 'play', strategyId: 'cuphandle' },
  { id: 20, tier: 4, kind: 'play', strategyId: 'ma' },
  { id: 21, tier: 4, kind: 'play', strategyId: 'rsi' },
  { id: 22, tier: 4, kind: 'play', strategyId: 'macd' },
  { id: 23, tier: 4, kind: 'play', strategyId: 'bollinger' },
  { id: 24, tier: 4, kind: 'play', strategyId: 'stoch' },
  { id: 25, tier: 4, kind: 'quiz', quizId: 'atr' },
  { id: 26, tier: 4, kind: 'play', strategyId: 'fibo' },
  { id: 27, tier: 4, kind: 'play', strategyId: 'fiboext' },
  { id: 28, tier: 5, kind: 'play', strategyId: 'volume' },
  { id: 29, tier: 5, kind: 'play', strategyId: 'vwap' },
  { id: 30, tier: 5, kind: 'play', strategyId: 'volumeprofile' },
  { id: 31, tier: 5, kind: 'play', strategyId: 'liquidityzones' },
  { id: 32, tier: 5, kind: 'quiz', quizId: 'orderflow' },
  { id: 33, tier: 6, kind: 'play', strategyId: 'orderblock' },
  { id: 34, tier: 6, kind: 'play', strategyId: 'fvg' },
  { id: 35, tier: 6, kind: 'play', strategyId: 'liquiditysweep' },
  { id: 36, tier: 6, kind: 'play', strategyId: 'breakerblock' },
  { id: 37, tier: 6, kind: 'play', strategyId: 'chochbos' },
  { id: 38, tier: 6, kind: 'play', strategyId: 'premiumdiscount' },
  { id: 39, tier: 6, kind: 'play', strategyId: 'killzones' },
  { id: 40, tier: 6, kind: 'play', strategyId: 'ote' },
  { id: 41, tier: 7, kind: 'quiz', quizId: 'correlation' },
  { id: 42, tier: 7, kind: 'play', strategyId: 'sessions' },
  { id: 43, tier: 7, kind: 'play', strategyId: 'news' },
  { id: 44, tier: 7, kind: 'quiz', quizId: 'sentiment' },
  { id: 45, tier: 8, kind: 'play', strategyId: 'confluencesr' },
  { id: 46, tier: 8, kind: 'play', strategyId: 'confluenceictfibo' },
  { id: 47, tier: 8, kind: 'quiz', quizId: 'multitf' },
  { id: 48, tier: 8, kind: 'tool' },
];

export type StartChoice = 'debutant' | 'intermediaire' | 'avance';
export const RECOMMENDED_START: Record<StartChoice, number> = { debutant: 1, intermediaire: 8, avance: 33 };

export const levelById = (id: number): LevelDef | undefined => LEVELS.find((l) => l.id === id);
