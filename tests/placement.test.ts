import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLACEMENT_QUESTIONS, PLACEMENT_TOTAL, OPTION_COUNT, placementFor, shuffledOrder } from '../src/core/data/placement';
import { dictionary } from '../src/core/i18n/dictionary';

const ids = PLACEMENT_QUESTIONS.map((q) => q.id);

test('placement : seuils débutant / intermédiaire / avancé', () => {
  assert.equal(placementFor([]), 'debutant');
  assert.equal(placementFor(['candle', 'support', 'pnl']), 'debutant');
  assert.equal(placementFor(['candle', 'support', 'pnl', 'rr']), 'intermediaire');
  assert.equal(placementFor(['candle', 'support', 'pnl', 'rr', 'streak']), 'intermediaire');
  assert.equal(placementFor(ids), 'avance');
});

test('placement : 6 bonnes réponses sans réussir les deux calculs difficiles = intermédiaire', () => {
  const sixWithoutExpectancy = ids.filter((id) => id !== 'expectancy');
  assert.equal(sixWithoutExpectancy.length, 6);
  assert.equal(placementFor(sixWithoutExpectancy), 'intermediaire');
  const sixWithoutDrawdown = ids.filter((id) => id !== 'drawdown');
  assert.equal(placementFor(sixWithoutDrawdown), 'intermediaire');
});

test('placement : le mélange est une permutation valide et varie selon la graine', () => {
  const seen = new Set<string>();
  for (let seed = 1; seed <= 40; seed++) {
    const o = shuffledOrder(seed);
    assert.equal(o.length, OPTION_COUNT);
    assert.deepEqual([...o].sort(), [0, 1, 2, 3]);
    seen.add(o.join(''));
  }
  assert.ok(seen.size > 5);
  assert.deepEqual(shuffledOrder(7), shuffledOrder(7));
});

test('placement : chaque question a un énoncé et 4 options dans les 3 langues, sans doublon', () => {
  assert.equal(PLACEMENT_TOTAL, 7);
  for (const lang of ['fr', 'en', 'es'] as const) {
    for (const id of ids) {
      assert.ok(dictionary[lang][`pq_${id}_q`], `${lang} pq_${id}_q`);
      const opts = Array.from({ length: OPTION_COUNT }, (_, i) => dictionary[lang][`pq_${id}_a${i}`]);
      opts.forEach((o, i) => assert.ok(o, `${lang} pq_${id}_a${i}`));
      assert.equal(new Set(opts).size, OPTION_COUNT, `${lang} ${id} : options en double`);
    }
  }
});
