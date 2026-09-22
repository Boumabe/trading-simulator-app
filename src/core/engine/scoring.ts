import { ECONOMY } from '../constants';

export type Stars = 0 | 1 | 2 | 3;

/** Les étoiles mesurent la DISCIPLINE, jamais le hasard du gain. */
export function starsFor(disciplinePct: number, trades: number): Stars {
  if (trades < 1) return 0;
  if (disciplinePct >= 100) return 3;
  if (disciplinePct >= 75) return 2;
  if (disciplinePct >= ECONOMY.PASS_DISCIPLINE) return 1;
  return 0;
}

export const xpForTrade = (compliant: boolean, combo: number): number => (compliant ? 10 + Math.min(Math.max(combo - 1, 0), 4) * 3 : 0);

export function xpForLevel(stars: Stars, previousBest: number): number {
  if (stars <= previousBest) return 0;
  const gain = (s: number) => (s > 0 ? 20 + 15 * s : 0);
  return gain(stars) - gain(previousBest);
}

export const disciplinePct = (compliant: number, total: number): number => (total ? Math.round((compliant / total) * 100) : 0);
