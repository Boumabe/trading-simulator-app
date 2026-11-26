import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS } from '../src/core/data/scenarios';
import { compile, leadPaths } from '../src/core/engine/scenario';
import { entryStatus } from '../src/core/engine/rules';
import { hudState } from '../src/core/engine/hud';
import { initSession, makeReducer } from '../src/core/engine/session';
import { SESSION } from '../src/core/constants';

const keys = Object.keys(SCENARIOS);

/** Premier instant (bougie, tick) où une entrée conforme existe, dans l'une ou l'autre direction. */
function firstCompliant(key: string): { closed: number; tick: number } | null {
  const rt = compile(key, SCENARIOS[key]);
  for (let closed = rt.lead; closed < rt.n; closed++) {
    for (let tick = 0; tick < SESSION.TICKS_PER_CANDLE; tick++) {
      const price = rt.ticks[closed][tick];
      if ((['buy', 'sell'] as const).some((type) => entryStatus(rt, { type, price, closed }).compliant)) return { closed, tick };
    }
  }
  return null;
}

test('historique : se termine exactement sur le prix de départ, déterministe, calme', () => {
  const paths = leadPaths('demo', 8, 112);
  assert.equal(paths.length, 8);
  assert.equal(paths[7][1], 112);
  for (let i = 1; i < paths.length; i++) assert.equal(paths[i][0], paths[i - 1][1]); // continuité
  assert.deepEqual(paths, leadPaths('demo', 8, 112));
  for (const [a, b] of paths) assert.ok(Math.abs(b - a) / 112 < 0.06, 'historique calme');
  assert.deepEqual(leadPaths('demo', 0, 100), []);
});

test('historique : la session démarre avec les bougies d’historique déjà dessinées, le reset aussi', () => {
  const rt = compile('rsi', SCENARIOS.rsi);
  assert.ok(rt.lead > 0);
  assert.equal(rt.n, SCENARIOS.rsi.candles.length + rt.lead);
  const s0 = initSession(rt.lead);
  assert.equal(s0.closed, rt.lead);
  assert.equal(makeReducer(rt)({ ...s0, closed: rt.lead + 3 }, { type: 'reset' }).closed, rt.lead);
});

test('indicateurs : la courbe existe dès la première image et le signal arrive après plusieurs bougies d’évolution', () => {
  for (const key of keys.filter((k) => ['indicator', 'band', 'ma'].includes(SCENARIOS[k].mode))) {
    const rt = compile(key, SCENARIOS[key]);
    assert.ok(rt.lead >= 6, `${key} : historique`);
    const first = (rt.series.a ?? rt.series.sma)!;
    assert.ok(first[rt.lead - 1] != null, `${key} : indicateur défini à l'ouverture`);
    if (rt.cfg.mode === 'indicator' && rt.cfg.indicator !== 'rsi') assert.ok(rt.series.b![rt.lead - 1] != null, `${key} : 2e courbe définie à l'ouverture`);
    assert.ok(rt.signals.length > 0, `${key} : un signal existe`);
    const firstSignal = Math.min(...rt.signals.map((s) => s.start));
    assert.ok(firstSignal - rt.lead >= 3, `${key} : au moins 3 bougies d'évolution avant le signal (signal à ${firstSignal}, historique ${rt.lead})`);
  }
});

test('zones : rien n’est valable avant la formation du motif, et le niveau reste jouable après', () => {
  const withReveal = keys.filter((k) => (SCENARIOS[k].zoneFrom ?? 0) > 0);
  assert.ok(withReveal.length >= 15, 'les niveaux à motif sont concernés');
  for (const key of withReveal) {
    const rt = compile(key, SCENARIOS[key]);
    for (let closed = rt.lead; closed < rt.zoneFrom; closed++) {
      for (let tick = 0; tick < SESSION.TICKS_PER_CANDLE; tick++) {
        const price = rt.ticks[closed][tick];
        for (const type of ['buy', 'sell'] as const) {
          const v = entryStatus(rt, { type, price, closed });
          assert.equal(v.compliant, false, `${key} : entrée conforme avant l'apparition (bougie ${closed})`);
          assert.equal(v.reason, 'too_early');
        }
      }
    }
    const first = firstCompliant(key);
    assert.ok(first, `${key} : jouable après l'apparition`);
    assert.ok(first!.closed >= rt.zoneFrom, `${key} : première entrée conforme après l'apparition`);
    // on laisse le temps de voir la zone apparaître : pas d'entrée conforme dans la 1re seconde de la bougie d'apparition
    // (la ligne de tendance suit le prix de bout en bout : l'entrée y est valable dès qu'elle apparaît)
    if (rt.cfg.mode !== 'trendzone') assert.ok(first!.closed > rt.zoneFrom || first!.tick >= 10, `${key} : délai entre l'apparition et la 1re entrée conforme`);
  }
});

test('bloc d’ordres : impulsion d’abord, zone ensuite, retour sur la zone pour acheter', () => {
  const rt = compile('orderblock', SCENARIOS.orderblock);
  assert.equal(rt.zoneFrom, 7);
  const first = firstCompliant('orderblock')!;
  assert.ok(first.closed >= 9, 'le retour sur la zone vient après l\'impulsion');
  // pendant l'impulsion, le prix a touché la zone mais rien n'est visible ni valable
  const v = entryStatus(rt, { type: 'buy', price: 100.2, closed: 4 });
  assert.deepEqual([v.compliant, v.reason], [false, 'too_early']);
});

test('affichage : « observe la formation » tant que la zone n’est pas tracée', () => {
  const rt = compile('fvg', SCENARIOS.fvg);
  const s = { ...initSession(0), status: 'running' as const, closed: 1, tick: 5 };
  assert.equal(hudState(rt, s).key, 'hud_watching');
  assert.notEqual(hudState(rt, { ...s, closed: rt.zoneFrom }).key, 'hud_watching');
});

test('niveaux sans apparition tardive : comportement inchangé (zone visible dès le départ)', () => {
  const rt = compile('support', SCENARIOS.support);
  assert.equal(rt.zoneFrom, 0);
  assert.equal(rt.lead, 0);
  assert.equal(initSession(rt.lead).closed, 0);
});

import { rulesLabel } from '../src/core/rulesText';
import { dictionary } from '../src/core/i18n/dictionary';

const tr = (lang: 'fr' | 'en' | 'es') => (key: string, params: Record<string, string | number> = {}) =>
  (dictionary[lang][key] ?? `??${key}`).replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));

test('texte de règle : annonce le bon nombre de contacts et la zone tracée après le motif, dans chaque langue', () => {
  for (const lang of ['fr', 'en', 'es'] as const) {
    const t = tr(lang);
    for (const key of keys) {
      const label = rulesLabel(compile(key, SCENARIOS[key]), t);
      assert.ok(!label.includes('??') && !/\{\w+\}/.test(label), `${lang} ${key} : ${label}`);
    }
  }
  const fr = tr('fr');
  assert.ok(rulesLabel(compile('orderblock', SCENARIOS.orderblock), fr).startsWith('La zone se trace une fois le motif formé'));
  assert.ok(rulesLabel(compile('support', SCENARIOS.support), fr).includes('2 contacts'), 'support : 2 contacts requis');
  assert.ok(!rulesLabel(compile('breakout', SCENARIOS.breakout), fr).includes('2 contacts'));
  assert.ok(['hud_watching', 'rule_zone_formed'].every((k) => dictionary.fr[k] && dictionary.en[k] && dictionary.es[k]));
});
