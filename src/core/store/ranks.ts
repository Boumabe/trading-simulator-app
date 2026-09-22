export interface Rank { index: number; key: string; min: number; next: number | null; progress: number }

const THRESHOLDS = [0, 100, 300, 700, 1400, 2500, 4000] as const;

export function rankOf(xp: number): Rank {
  let index = 0;
  THRESHOLDS.forEach((min, i) => {
    if (xp >= min) index = i;
  });
  const min = THRESHOLDS[index];
  const next = index + 1 < THRESHOLDS.length ? THRESHOLDS[index + 1] : null;
  const progress = next === null ? 1 : (xp - min) / (next - min);
  return { index, key: `rank_${index + 1}`, min, next, progress: Math.max(0, Math.min(1, progress)) };
}

export const RANK_COUNT = THRESHOLDS.length;
