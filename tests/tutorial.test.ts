import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dictionary } from '../src/core/i18n/dictionary';
import { countsFor } from '../src/core/services/analytics';
import { buildReport, reportToText } from '../src/core/services/statsReport';

test('tutoriel guidé : 8 étapes avec titre et texte dans chaque langue, plus le libellé de zone', () => {
  for (const lang of ['fr', 'en', 'es'] as const) {
    assert.ok(dictionary[lang].chart_zone, `${lang} chart_zone`);
    for (let i = 1; i <= 8; i++) {
      assert.ok(dictionary[lang][`tut_${i}_t`], `${lang} tut_${i}_t`);
      assert.ok(dictionary[lang][`tut_${i}_d`], `${lang} tut_${i}_d`);
    }
    for (const k of ['tour_skip', 'tour_next', 'tour_start', 'play_buy', 'play_sell']) assert.ok(dictionary[lang][k], `${lang} ${k}`);
  }
});

test('tutoriel guidé : la mesure passe sous la clé « c » (règles Firestore publiées) et apparaît dans le rapport', () => {
  assert.deepEqual(countsFor({ e: 'tour', track: 'debutant', step: '3' }), { c: { tour: { '3': { debutant: 1 } } } });
  assert.deepEqual(countsFor({ e: 'tour', track: 'new', step: 'skip' }), { c: { tour: { skip: { new: 1 } } } });
  const text = reportToText(buildReport({ c: { tour: { '1': { debutant: 4 }, '2': { debutant: 3 }, done: { debutant: 2 }, skip: { debutant: 2 } } } }));
  assert.ok(text.includes('1:4  2:3  3:0'));
  assert.ok(text.includes('terminé 2 · passé 2'));
});
