import type { Lang } from '../types';
import { BASE } from './base';
import { EXTRA } from './extra';
import { DIAGRAM_TEXT } from './diagrams';
import { ARENA_TEXT } from './arena';
import { PLACEMENT_TEXT } from './placement';
import { LESSON_TEXT } from './lesson';
import { TUTORIAL_TEXT } from './tutorial';

/** Dictionnaire complet (sans dépendance React Native : testable en Node). */
export const dictionary: Record<Lang, Record<string, string>> = {
  fr: { ...BASE.fr, ...DIAGRAM_TEXT.fr, ...EXTRA.fr, ...ARENA_TEXT.fr, ...PLACEMENT_TEXT.fr, ...LESSON_TEXT.fr, ...TUTORIAL_TEXT.fr },
  en: { ...BASE.en, ...DIAGRAM_TEXT.en, ...EXTRA.en, ...ARENA_TEXT.en, ...PLACEMENT_TEXT.en, ...LESSON_TEXT.en, ...TUTORIAL_TEXT.en },
  es: { ...BASE.es, ...DIAGRAM_TEXT.es, ...EXTRA.es, ...ARENA_TEXT.es, ...PLACEMENT_TEXT.es, ...LESSON_TEXT.es, ...TUTORIAL_TEXT.es },
};
