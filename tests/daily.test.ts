import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_POOL, DAILY_EPOCH, countdownParts, dailyNumber, dailyStatus, dailyStreakAtRisk, dailyUnlocked, finishDailyState,
  initialDaily, liveDailyStreak, marksFrom, marksToSquares, msUntilNextDaily, pickDaily, shareText, variantFor, weekDots, PLAY_URL,
} from '../src/core/daily';
import { sanitizeDaily } from '../src/core/store/logic';
import { compile } from '../src/core/engine/scenario';
import { entryStatus } from '../src/core/engine/rules';
import { countsFor, type Counts } from '../src/core/services/analytics';
import { buildReport, reportToText } from '../src/core/services/statsReport';
import { SESSION } from '../src/core/constants';

const dayAfter = (key: string, n: number) => {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
};

test('numéro du défi : n°1 le jour de départ, jamais inférieur à 1', () => {
  assert.equal(dailyNumber(DAILY_EPOCH), 1);
  assert.equal(dailyNumber(dayAfter(DAILY_EPOCH, 9)), 10);
  assert.equal(dailyNumber('2026-01-01'), 1);
});

test('niveau du jour : le même pour tous, chaque niveau une fois par cycle, jamais deux jours de suite', () => {
  const len = DAILY_POOL.length;
  assert.ok(len >= 30, 'réserve suffisante de niveaux');
  assert.deepEqual(pickDaily(DAILY_EPOCH).level, pickDaily(DAILY_EPOCH).level);
  for (let cycle = 0; cycle < 3; cycle++) {
    const ids = new Set<number>();
    for (let i = 0; i < len; i++) ids.add(pickDaily(dayAfter(DAILY_EPOCH, cycle * len + i)).level.id);
    assert.equal(ids.size, len, `cycle ${cycle} : chaque niveau exactement une fois`);
  }
  let prev = -1;
  for (let i = 0; i < len * 3; i++) {
    const id = pickDaily(dayAfter(DAILY_EPOCH, i)).level.id;
    assert.notEqual(id, prev, `jour ${i} : pas de répétition`);
    prev = id;
  }
});

test('variante : même motif, prix mis à l’échelle (0,9 à 1,15), déterministe, et le niveau reste jouable', () => {
  for (const level of DAILY_POOL) {
    for (const k of [0, 1, 2]) {
      const key = dayAfter(DAILY_EPOCH, 40 + k * 17);
      const v = variantFor(level, key);
      const again = variantFor(level, key);
      assert.deepEqual(v.cfg, again.cfg);
      assert.ok(v.factor >= 0.9 && v.factor <= 1.15, `${level.strategyId} facteur ${v.factor}`);
      assert.equal(v.cfg.candles.length, (await_base(level)).candles.length);
      const rt = compile(v.id, v.cfg);
      // au moins une entrée conforme existe, et jamais avant l'apparition de la zone
      let found = false;
      for (let closed = rt.lead; closed < rt.n && !found; closed++) {
        for (let tick = 0; tick < SESSION.TICKS_PER_CANDLE && !found; tick++) {
          const price = rt.ticks[closed][tick];
          if ((['buy', 'sell'] as const).some((type) => entryStatus(rt, { type, price, closed }).compliant)) found = true;
        }
      }
      assert.ok(found, `${level.strategyId} (${key}) : jouable`);
    }
  }
});
import { SCENARIOS } from '../src/core/data/scenarios';
const await_base = (l: { strategyId?: string }) => SCENARIOS[l.strategyId!];

test('variante : deux jours différents donnent deux graphiques différents pour le même niveau', () => {
  const level = DAILY_POOL[0];
  const a = variantFor(level, '2026-12-05');
  const b = variantFor(level, '2026-12-06');
  assert.notEqual(a.id, b.id);
  assert.notDeepEqual(a.cfg.candles[0].path, b.cfg.candles[0].path);
});

test('série : +1 par jour, un jour manqué toléré, deux jours manqués remettent à 1, pas de double comptage', () => {
  const d0 = '2026-12-01';
  const play = (st: ReturnType<typeof initialDaily>, key: string, disc = 80) => finishDailyState(st, { key, discipline: disc, marks: 'GGR', trades: 3 });
  let r = play(initialDaily(), d0);
  assert.equal(r.streak, 1);
  assert.equal(r.first, true);
  r = play(r.daily, dayAfter(d0, 1));
  assert.equal(r.streak, 2);
  assert.equal(r.first, false);
  const same = play(r.daily, dayAfter(d0, 1));
  assert.equal(same.daily.plays, 2, 'même jour : pas de double comptage');
  r = play(r.daily, dayAfter(d0, 3)); // un jour manqué (le 2e) : la série continue
  assert.equal(r.streak, 3);
  assert.equal(r.milestone, 3);
  r = play(r.daily, dayAfter(d0, 7)); // 4 jours d'écart : série perdue
  assert.equal(r.streak, 1);
  assert.equal(r.daily.best, 3);
  assert.equal(r.daily.plays, 4);
});

test('série : jalons 7 et 30, calendrier limité à 14 jours', () => {
  let st = initialDaily();
  let last: ReturnType<typeof finishDailyState> | null = null;
  const marks: number[] = [];
  for (let i = 0; i < 31; i++) {
    last = finishDailyState(st, { key: dayAfter('2026-12-01', i), discipline: 90, marks: 'G', trades: 1 });
    st = last.daily;
    if (last.milestone) marks.push(last.milestone);
  }
  assert.deepEqual(marks, [3, 7, 14, 30]);
  assert.equal(st.recent.length, 14);
  assert.equal(st.streak, 31);
});

test('série affichée et « en danger »', () => {
  const st = finishDailyState(initialDaily(), { key: '2026-12-01', discipline: 70, marks: 'G', trades: 1 }).daily;
  assert.equal(liveDailyStreak(st, '2026-12-01'), 1);
  assert.equal(liveDailyStreak(st, '2026-12-02'), 1);
  assert.equal(dailyStreakAtRisk(st, '2026-12-02'), false);
  assert.equal(liveDailyStreak(st, '2026-12-03'), 1, 'un jour manqué : encore vivante');
  assert.equal(dailyStreakAtRisk(st, '2026-12-03'), true, 'à jouer aujourd’hui');
  assert.equal(liveDailyStreak(st, '2026-12-04'), 0, 'deux jours manqués : perdue');
  assert.equal(dailyStreakAtRisk(st, '2026-12-04'), false);
});

test('accès et état de la carte', () => {
  assert.equal(dailyUnlocked({ choice: 'debutant', levels: {} }), false);
  assert.equal(dailyUnlocked({ choice: 'debutant', levels: { 1: { stars: 1 } } }), true);
  assert.equal(dailyUnlocked({ choice: 'intermediaire', levels: {} }), true);
  assert.equal(dailyUnlocked({ choice: null, levels: {} }), true);
  const done = finishDailyState(initialDaily(), { key: '2026-12-01', discipline: 70, marks: 'G', trades: 1 }).daily;
  assert.equal(dailyStatus(done, '2026-12-01', true), 'done');
  assert.equal(dailyStatus(done, '2026-12-02', true), 'ready');
  assert.equal(dailyStatus(initialDaily(), '2026-12-02', false), 'locked');
});

test('résultat partageable : sans spoiler, avec le lien, dans chaque langue', () => {
  assert.equal(marksFrom([{ compliant: true }, { compliant: false }, { compliant: true }]), 'GRG');
  assert.equal(marksFrom(Array.from({ length: 12 }, () => ({ compliant: true }))).length, 8);
  assert.equal(marksToSquares('GR'), '🟩🟥');
  for (const lang of ['fr', 'en', 'es'] as const) {
    const t = shareText(lang, { number: 12, marks: 'GGRG', discipline: 75, streak: 4 });
    assert.ok(t.includes('12') && t.includes('🟩🟩🟥🟩') && t.includes('75') && t.includes('4') && t.includes(PLAY_URL), lang);
    assert.ok(!/\{\w+\}/.test(t), `${lang} : paramètre non remplacé`);
    const noStreak = shareText(lang, { number: 12, marks: 'G', discipline: 100, streak: 1 });
    assert.ok(!noStreak.includes('🔥'), `${lang} : pas de série affichée à 1 jour`);
  }
});

test('compte à rebours jusqu’à minuit', () => {
  const t = new Date(2026, 11, 1, 23, 30, 0).getTime();
  assert.equal(Math.round(msUntilNextDaily(t) / 60000), 30);
  assert.deepEqual(countdownParts(90 * 60000), { h: 1, m: 30 });
  assert.deepEqual(countdownParts(0), { h: 0, m: 0 });
});

test('calendrier de la semaine', () => {
  let st = initialDaily();
  for (const k of ['2026-12-05', '2026-12-07']) st = finishDailyState(st, { key: k, discipline: 80, marks: 'G', trades: 1 }).daily;
  const dots = weekDots(st, '2026-12-07');
  assert.equal(dots.length, 7);
  assert.equal(dots[6].today, true);
  assert.deepEqual(dots.filter((d) => d.done).map((d) => d.key), ['2026-12-05', '2026-12-07']);
});

test('sauvegarde : valeurs invalides ignorées, anciennes sauvegardes sans défi acceptées', () => {
  const d = sanitizeDaily({ streak: -3, best: 'x', plays: 2.9, lastKey: 'nimporte', started: '2026-12-01', today: { key: '2026-12-01', discipline: 250, marks: 'GXR', trades: 2 }, recent: [{ key: '2026-12-01', d: 80 }, { key: 'zz', d: 1 }], remind: 1 });
  assert.deepEqual([d.streak, d.best, d.plays, d.lastKey, d.started], [0, 0, 2, null, '2026-12-01']);
  assert.deepEqual(d.today, { key: '2026-12-01', discipline: 100, marks: 'GR', trades: 2 });
  assert.deepEqual(d.recent, [{ key: '2026-12-01', d: 80 }]);
  assert.equal(d.remind, true);
  assert.deepEqual(sanitizeDaily(undefined), initialDaily());
});

test('mesure du défi : compteurs sous les clés autorisées et rapport lisible', () => {
  const allowed = new Set(['c', 'lv', 'lvt', 'why', 'diff', 'diffT', 'dq', 'diag', 'cohort', 'ret', 'spd']);
  const evs = [
    { e: 'daily_view', track: 'debutant', state: 'ready' }, { e: 'daily_start', track: 'debutant' }, { e: 'daily_done', track: 'debutant', discipline: 80 },
    { e: 'daily_quit', track: 'avance', trades: 0 }, { e: 'daily_share', track: 'avance' }, { e: 'daily_streak', n: 7 },
    { e: 'daily_reminder', track: 'new', on: true }, { e: 'daily_first' },
  ] as const;
  for (const ev of evs) for (const k of Object.keys(countsFor(ev as never))) assert.ok(allowed.has(k), `${ev.e} : clé ${k}`);
  assert.deepEqual(countsFor({ e: 'daily_done', track: 'debutant', discipline: 80 }), { c: { daily_done: { debutant: 1 }, daily_disc: { '75': 1 } } });
  assert.deepEqual(countsFor({ e: 'daily_done', track: 'debutant', discipline: 100 }), { c: { daily_done: { debutant: 1 }, daily_disc: { '100': 1 } } });
  assert.deepEqual(countsFor({ e: 'daily_first' }), { cohort: { dly: { yes: 1 } } });
  const stats: Counts = {
    cohort: { n: 20, dly: { yes: 6 } },
    ret: { dly: { d1: { yes: 4, no: 3 }, d7: { yes: 2, no: 1 } } },
    c: { daily_view: { ready: { debutant: 10 }, done: { debutant: 4 } }, daily_start: { debutant: 8 }, daily_done: { debutant: 6 }, daily_share: { debutant: 3 }, daily_quit: { before_trade: { debutant: 1 }, after_trade: { debutant: 1 } }, daily_streak: { '3': 2 } },
  };
  const text = reportToText(buildReport(stats));
  assert.ok(text.includes('Commencés : 8 · validés : 6 (75 % des commencés) · partagés : 3 (50 % des validés)'));
  assert.ok(text.includes('A fait au moins un défi : 6 joueurs · D1 4 (67 %) · D7 2 (33 %)'));
  assert.ok(text.includes('N’a fait aucun défi : 14 joueurs · D1 3 (21 %) · D7 1 (7 %)'));
  assert.ok(text.includes('3 j : 2'));
});

import { initSession, makeReducer } from '../src/core/engine/session';
import { sessionStats } from '../src/core/engine/session';
import { initialState, toPersisted, sanitize } from '../src/core/store/logic';

/** Joue un défi de bout en bout avec un « robot » : n'entre que sur une entrée conforme (ou jamais). */
function playBot(levelIdx: number, key: string, trade: boolean) {
  const level = DAILY_POOL[levelIdx];
  const v = variantFor(level, key);
  const rt = compile(v.id, v.cfg);
  const reduce = makeReducer(rt);
  let s = reduce(initSession(rt.lead), { type: 'start' });
  let guard = 0;
  while (s.status !== 'ended' && guard++ < 50000) {
    if (trade && !s.position && s.status === 'running') {
      for (const side of ['buy', 'sell'] as const) {
        const price = rt.ticks[Math.min(s.closed, rt.n - 1)][Math.min(s.tick, SESSION.TICKS_PER_CANDLE - 1)];
        if (!s.position && entryStatus(rt, { type: side, price, closed: s.closed }).compliant) s = reduce(s, { type: 'open', side, opts: {} });
      }
    }
    s = reduce(s, { type: 'tick' });
  }
  return { s, rt, stats: sessionStats(s) };
}

test('défi de bout en bout : la partie se termine, sans trade = non validé, avec trades conformes = discipline mesurée', () => {
  for (const idx of [0, 7, 15, 23, 31, DAILY_POOL.length - 1]) {
    const key = dayAfter(DAILY_EPOCH, 3 * idx);
    const idle = playBot(idx, key, false);
    assert.equal(idle.s.status, 'ended');
    assert.equal(idle.s.closed >= idle.rt.n - 1, true);
    assert.equal(idle.stats.count, 0, 'aucun trade pris : défi non validé');
    const active = playBot(idx, key, true);
    assert.equal(active.s.status, 'ended');
    assert.ok(active.stats.count >= 1, `niveau ${DAILY_POOL[idx].strategyId} : au moins un trade possible`);
    assert.ok(active.stats.discipline >= 50, `niveau ${DAILY_POOL[idx].strategyId} : un joueur qui n'entre que sur signal valide fait au moins 50 % (${active.stats.discipline})`);
    assert.ok(marksFrom(active.s.trades).length >= 1);
  }
});

test('défi : la sauvegarde conserve la série et le jour validé', () => {
  const done = finishDailyState(initialDaily(), { key: '2026-12-02', discipline: 90, marks: 'GG', trades: 2 }).daily;
  const saved = JSON.parse(JSON.stringify(toPersisted({ ...initialState(), challenge: done })));
  assert.deepEqual(sanitize(saved).challenge, done);
});
