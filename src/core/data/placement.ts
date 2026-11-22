import type { StartChoice } from './levels';

/**
 * Test de niveau : 7 questions concrètes (lecture de graphique, calculs chiffrés, comportement).
 * Pourquoi pas une auto-déclaration : un régulateur (ASIC, rapport 828, 2026) juge les questionnaires déclaratifs peu fiables ;
 * ses bonnes pratiques : plusieurs critères, exemples chiffrés, options mélangées, tentatives limitées.
 *
 * Textes dans i18n/placement.ts : `pq_<id>_q` (énoncé) et `pq_<id>_a0..a3` (a0 = BONNE réponse, l'ordre est mélangé à l'affichage).
 */
export const PLACEMENT_QUESTIONS = [
  { id: 'candle', kind: 'concept' },
  { id: 'support', kind: 'concept' },
  { id: 'pnl', kind: 'calc' },
  { id: 'rr', kind: 'calc' },
  { id: 'drawdown', kind: 'calc' },
  { id: 'expectancy', kind: 'calc' },
  { id: 'streak', kind: 'behavior' },
] as const;

export type PlacementQuestionId = (typeof PLACEMENT_QUESTIONS)[number]['id'];
export const PLACEMENT_TOTAL = PLACEMENT_QUESTIONS.length;
export const OPTION_COUNT = 4;

/** Questions chiffrées difficiles : il faut les réussir pour être placé « avancé ». */
const ADVANCED_GATE: PlacementQuestionId[] = ['drawdown', 'expectancy'];

/** Profil déduit des bonnes réponses. Seuils = choix de conception, à ajuster avec les statistiques (distribution des scores). */
export function placementFor(correctIds: readonly string[]): StartChoice {
  const n = correctIds.length;
  if (n >= 6 && ADVANCED_GATE.every((id) => correctIds.includes(id))) return 'avance';
  if (n >= 4) return 'intermediaire';
  return 'debutant';
}

/** PRNG déterministe (mulberry32) : permet de tester le mélange. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ordre d'affichage des options : permutation de [0..3] ; la bonne réponse est l'index 0 des textes. */
export function shuffledOrder(seed: number): number[] {
  const rnd = mulberry32(seed);
  const order = Array.from({ length: OPTION_COUNT }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
