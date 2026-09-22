/** Économie du jeu : tout est ici pour pouvoir équilibrer sans toucher au code. */
export const ECONOMY = {
  START_BALANCE: 100,
  /** $ gagnés/perdus par point de prix (avant : ×10, ce qui écrasait la discipline). */
  POINT_VALUE: 1,
  /** Bonus versé pour chaque trade conforme, même s'il perd : on récompense le processus. */
  COMPLIANT_BONUS: 5,
  /** Pénalité pour un trade hors règle. */
  PENALTY: 10,
  /** Sous ce solde, la recharge de secours (1 / jour) est proposée. */
  REFILL_THRESHOLD: 10,
  REFILL_TO: 50,
  DAILY_BASE: 5,
  DAILY_STEP: 2,
  DAILY_MAX_STEPS: 5,
  /** Discipline minimale (%) pour valider un niveau. */
  PASS_DISCIPLINE: 50,
  /** Au-delà de N validations, les gains de capital d'un niveau sont réduits (anti-farm). */
  REPLAY_FULL_PAYOUTS: 3,
  REPLAY_FACTOR: 0.25,
} as const;

export const SESSION = {
  TICKS_PER_CANDLE: 60,
  /** 60 ticks × 150 ms = 9 s par bougie à vitesse ×1. */
  TICK_MS: 150,
  WINDOW_SIZE: 12,
  ZONE_TOL: 0.3,
} as const;

export const SPEEDS = [1, 2, 4] as const;
export type Speed = (typeof SPEEDS)[number];
