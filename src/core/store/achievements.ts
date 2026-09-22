import type { Persisted } from './logic';

export interface AchievementDef { id: string; icon: string; test: (s: Persisted) => boolean }

const passedLevels = (s: Persisted) => Object.values(s.levels).filter((l) => l.stars >= 1).length;

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_trade', icon: '🎯', test: (s) => s.stats.trades >= 1 },
  { id: 'rule_follower', icon: '✅', test: (s) => s.stats.compliant >= 1 },
  { id: 'combo_3', icon: '🔥', test: (s) => s.stats.bestCombo >= 3 },
  { id: 'combo_5', icon: '⚡', test: (s) => s.stats.bestCombo >= 5 },
  { id: 'clean_sheet', icon: '⭐', test: (s) => s.stats.perfect >= 1 },
  { id: 'levels_5', icon: '🧭', test: (s) => passedLevels(s) >= 5 },
  { id: 'levels_15', icon: '🗺️', test: (s) => passedLevels(s) >= 15 },
  { id: 'levels_30', icon: '🏔️', test: (s) => passedLevels(s) >= 30 },
  { id: 'sniper', icon: '🎯', test: (s) => s.stats.sniper >= 1 },
  { id: 'streak_3', icon: '📅', test: (s) => s.streak.best >= 3 },
  { id: 'streak_7', icon: '🏆', test: (s) => s.streak.best >= 7 },
  { id: 'quiz_ace', icon: '🧠', test: (s) => s.stats.quizPerfect >= 1 },
];
