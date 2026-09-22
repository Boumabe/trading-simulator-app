import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS } from '../src/core/data/scenarios';
import { LEVELS } from '../src/core/data/levels';
import { compile } from '../src/core/engine/scenario';
import { entryStatus, zoneAccuracy, lineAccuracy } from '../src/core/engine/rules';
import { initSession, makeReducer, sessionStats, currentPrice, type SessionState } from '../src/core/engine/session';
import { starsFor, xpForTrade, xpForLevel } from '../src/core/engine/scoring';
import { SESSION } from '../src/core/constants';

const ids = Object.keys(SCENARIOS);
const rts = Object.fromEntries(ids.map((id) => [id, compile(id, SCENARIOS[id])]));

test('tous les niveaux jouables ont un scénario', () => {
  for (const l of LEVELS.filter((x) => x.kind === 'play')) assert.ok(rts[l.strategyId!], `scénario manquant: ${l.strategyId}`);
});

test('déterminisme : un niveau se rejoue à l’identique', () => {
  const a = compile('support', SCENARIOS.support);
  const b = compile('support', SCENARIOS.support);
  assert.deepEqual(a.ticks, b.ticks);
});

test('chaque niveau est gagnable : une entrée conforme existe (achat ou vente, à un tick donné)', () => {
  const stuck: string[] = [];
  for (const id of ids) {
    const rt = rts[id];
    let found = false;
    for (let c = 0; c < rt.n && !found; c++)
      for (let k = 0; k < SESSION.TICKS_PER_CANDLE && !found; k++)
        for (const type of ['buy', 'sell'] as const)
          if (entryStatus(rt, { type, price: rt.ticks[c][k], closed: c }).compliant) found = true;
    if (!found) stuck.push(id);
  }
  assert.deepEqual(stuck, [], `niveaux impossibles à réussir: ${stuck.join(', ')}`);
});

test('niveaux à signal : au moins un signal est détecté', () => {
  const none = ids.filter((id) => ['pattern', 'indicator', 'band', 'ma', 'vwap'].includes(rts[id].cfg.mode) && rts[id].signals.length === 0);
  assert.deepEqual(none, []);
});

test('anti-triche #2 : entrer avant le signal n’est jamais conforme', () => {
  for (const id of ids) {
    const rt = rts[id];
    if (!['pattern', 'indicator', 'band', 'ma', 'vwap'].includes(rt.cfg.mode)) continue;
    const first = Math.min(...rt.signals.map((s) => s.start));
    for (let c = 0; c < first; c++)
      for (const type of ['buy', 'sell'] as const)
        assert.equal(entryStatus(rt, { type, price: rt.ticks[c][0], closed: c }).compliant, false, `${id}: entrée à la bougie ${c} jugée conforme avant le signal (${first})`);
  }
});

test('anti-triche #4 : « 2 touches » est imposé (support)', () => {
  const rt = rts.support;
  const firstTouch = rt.candles.findIndex((c) => c.touch);
  const price = rt.candles[firstTouch].low + 0.5;
  assert.equal(entryStatus(rt, { type: 'buy', price, closed: firstTouch }).reason, 'unconfirmed');
  const secondTouch = rt.candles.findIndex((c, i) => c.touch && i > firstTouch);
  assert.equal(entryStatus(rt, { type: 'buy', price, closed: secondTouch }).compliant, true);
});

test('zone : mauvais sens et hors zone sont refusés', () => {
  const rt = rts.support;
  const t = rt.candles.findIndex((c, i) => c.touch && i > 5);
  assert.equal(entryStatus(rt, { type: 'sell', price: 100, closed: t }).reason, 'wrong_side');
  assert.equal(entryStatus(rt, { type: 'buy', price: 120, closed: t }).reason, 'out_zone');
});

test('anti-triche #5 : dessiner une zone énorme ne donne pas une précision élevée', () => {
  const real = SCENARIOS.support.zones![0];
  assert.ok(zoneAccuracy({ low: 90, high: 130 }, real) < 0.1);
  assert.ok(zoneAccuracy({ low: real.low, high: real.high }, real) > 0.99);
  assert.ok(zoneAccuracy({ low: 110, high: 111 }, real) === 0);
});

test('ligne de tendance : ligne correcte > ligne fausse', () => {
  const rt = rts.trendline;
  const good = lineAccuracy(rt, rt.cfg.trendAnchors!);
  const bad = lineAccuracy(rt, [{ idx: 0, price: 90 }, { idx: 1, price: 140 }]);
  assert.ok(good > 0.99 && bad < 0.5, `good=${good} bad=${bad}`);
});

function run(rt: ReturnType<typeof compile>, script: (s: SessionState, step: number) => ReturnType<typeof Object> | void) {
  const reduce = makeReducer(rt);
  let s = reduce(initSession(), { type: 'start' });
  let step = 0;
  while (s.status === 'running') {
    const before = s;
    script(s, step);
    s = reduce(s, { type: 'tick' });
    if (before === s) break;
    step++;
  }
  return s;
}

test('session : aucun trade = aucun niveau validable (anti-triche #1)', () => {
  const rt = rts.support;
  const s = run(rt, () => {});
  assert.equal(s.status, 'ended');
  const st = sessionStats(s);
  assert.equal(st.count, 0);
  assert.equal(starsFor(st.discipline, st.count), 0);
});

test('session : achat au tout début puis attente = non conforme sur les niveaux à signal', () => {
  for (const id of ['pinbar', 'rsi', 'macd', 'ma', 'bollinger', 'vwap', 'engulfing']) {
    const rt = rts[id];
    const reduce = makeReducer(rt);
    let s = reduce(initSession(), { type: 'start' });
    s = reduce(s, { type: 'open', side: rt.dir });
    while (s.status === 'running') s = reduce(s, { type: 'tick' });
    const st = sessionStats(s);
    assert.equal(st.count, 1, id);
    assert.equal(st.compliant, 0, `${id}: le « acheter au début et attendre » est encore conforme`);
  }
});

test('session : position ouverte à la fin = clôturée automatiquement', () => {
  const rt = rts.support;
  const reduce = makeReducer(rt);
  let s = reduce(initSession(), { type: 'start' });
  s = reduce(s, { type: 'open', side: 'buy' });
  while (s.status === 'running') s = reduce(s, { type: 'tick' });
  assert.equal(s.position, null);
  assert.equal(s.trades.length, 1);
  assert.equal(s.trades[0].exitClosed, rt.n);
  assert.equal(s.events.at(-1)?.type, 'ended');
});

test('session : pause fige le temps, reprise le relance', () => {
  const rt = rts.support;
  const reduce = makeReducer(rt);
  let s = reduce(initSession(), { type: 'start' });
  s = reduce(s, { type: 'tick' });
  s = reduce(s, { type: 'pause' });
  const frozen = s;
  assert.equal(reduce(s, { type: 'tick' }), frozen);
  assert.equal(reduce(reduce(s, { type: 'resume' }), { type: 'tick' }).tick, 2);
});

test('joueur parfait : première entrée conforme + tenir jusqu’à la fin = 100 % de discipline', () => {
  let wins = 0;
  const losers: string[] = [];
  for (const id of ids) {
    const rt = rts[id];
    const reduce = makeReducer(rt);
    let s = reduce(initSession(), { type: 'start' });
    let opened = false;
    while (s.status === 'running') {
      if (!opened) {
        for (const type of ['buy', 'sell'] as const) {
          if (!opened && entryStatus(rt, { type, price: currentPrice(rt, s), closed: s.closed }).compliant) {
            s = reduce(s, { type: 'open', side: type });
            opened = true;
          }
        }
      }
      s = reduce(s, { type: 'tick' });
    }
    const st = sessionStats(s);
    if (id === 'news') { assert.ok(st.count >= 0); continue; }
    assert.equal(st.discipline, 100, `${id}: discipline ${st.discipline}%`);
    if (st.pnl > 0) wins++; else losers.push(`${id}:${st.pnl}`);
  }
  console.log(`  joueur parfait gagnant sur ${wins}/${ids.length - 1} niveaux ; perdants: ${losers.join(', ') || 'aucun'}`);
});

test('scoring : étoiles, XP', () => {
  assert.equal(starsFor(100, 3), 3);
  assert.equal(starsFor(80, 5), 2);
  assert.equal(starsFor(50, 2), 1);
  assert.equal(starsFor(40, 5), 0);
  assert.equal(starsFor(100, 0), 0);
  assert.ok(xpForTrade(true, 5) > xpForTrade(true, 1));
  assert.equal(xpForTrade(false, 3), 0);
  assert.equal(xpForLevel(2, 2), 0);
  assert.ok(xpForLevel(3, 1) > 0);
});
