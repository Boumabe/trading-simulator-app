/** Leçon 0 : 4 cartes puis 3 questions avec correction immédiate (se tester aide plus que relire). */
export const LESSON_CARD_COUNT = 4;
export const LESSON_OPTIONS = 3;
/** answer = index (dans les textes `lqN_aX`) de la bonne réponse. */
export const LESSON_QUESTIONS = [
  { id: 'lq1', answer: 1 },
  { id: 'lq2', answer: 1 },
  { id: 'lq3', answer: 2 },
] as const;
