import type { LevelDef } from './data/levels';

/** Route Expo Router d'un niveau, selon son type. */
export function routeForLevel(l: LevelDef): string {
  if (l.kind === 'quiz') return `/quiz/${l.id}`;
  if (l.kind === 'tool') return '/system';
  return `/play/${l.id}`;
}
