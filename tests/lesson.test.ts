import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LESSON_CARD_COUNT, LESSON_OPTIONS, LESSON_QUESTIONS } from '../src/core/data/lesson';
import { dictionary } from '../src/core/i18n/dictionary';

test('leçon 0 : tous les textes existent en fr, en, es', () => {
  const keys = ['lesson_title', 'lesson_progress', 'lesson_next', 'lesson_skip', 'lesson_quiz_title', 'lesson_right', 'lesson_wrong', 'lesson_result_title', 'lesson_result_score', 'lesson_result_text', 'lesson_go',
    'lesson_lbl_high', 'lesson_lbl_close', 'lesson_lbl_open', 'lesson_lbl_low', 'lesson_lbl_support', 'lesson_bull', 'lesson_bear', 'map_lesson_title', 'map_lesson_sub',
    'profile_top_mistake', 'profile_top_mistake_count', 'profile_top_mistake_none', 'profile_honest', 'ob_src_title', 'ob_src_sub', 'ob_src_skip', 'ob_src_friend', 'ob_src_tiktok', 'ob_src_facebook', 'ob_src_instagram', 'ob_src_youtube', 'ob_src_whatsapp', 'ob_src_store', 'ob_src_other'];
  for (let i = 1; i <= LESSON_CARD_COUNT; i++) keys.push(`lesson_s${i}_t`, `lesson_s${i}_d`);
  for (const q of LESSON_QUESTIONS) {
    keys.push(`${q.id}_q`, `${q.id}_why`);
    for (let i = 0; i < LESSON_OPTIONS; i++) keys.push(`${q.id}_a${i}`);
  }
  for (const lang of ['fr', 'en', 'es'] as const) for (const k of keys) assert.ok(dictionary[lang][k], `${lang} ${k}`);
});

test('leçon 0 : la bonne réponse est un index valide, pas toujours le même', () => {
  for (const q of LESSON_QUESTIONS) assert.ok(q.answer >= 0 && q.answer < LESSON_OPTIONS);
  assert.ok(new Set(LESSON_QUESTIONS.map((q) => q.answer)).size > 1);
});

test('correctif : les raisons « trop tôt » et « trop tard » ont un texte dans chaque langue', () => {
  for (const lang of ['fr', 'en', 'es'] as const) for (const r of ['too_early', 'too_late', 'wrong_side', 'out_zone', 'unconfirmed', 'off_line', 'out_window', 'in_avoid']) assert.ok(dictionary[lang][`why_${r}`], `${lang} why_${r}`);
});
