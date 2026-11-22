import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bump, countsFor, dailyOf, isEmptyCounts, mapNumbers, mergeCounts, type Counts } from '../src/core/services/analytics';

test('bump crée les niveaux imbriqués et additionne', () => {
  const c: Counts = {};
  bump(c, ['a', 'b', 'c']);
  bump(c, ['a', 'b', 'c'], 2);
  bump(c, ['a', 1, 'x']);
  assert.deepEqual(c, { a: { b: { c: 3 }, '1': { x: 1 } } });
});

test('mergeCounts additionne sans modifier les entrées', () => {
  const a: Counts = { c: { open: { debutant: 1 } }, n: 2 };
  const b: Counts = { c: { open: { debutant: 2, avance: 1 } }, m: 1 };
  const out = mergeCounts(a, b);
  assert.deepEqual(out, { c: { open: { debutant: 3, avance: 1 } }, n: 2, m: 1 });
  assert.deepEqual(a, { c: { open: { debutant: 1 } }, n: 2 });
});

test('mapNumbers transforme chaque nombre et garde la structure', () => {
  assert.deepEqual(mapNumbers({ a: { b: 2 }, c: 1 }, (n) => `+${n}`), { a: { b: '+2' }, c: '+1' });
});

test('événement open : joueur, cohorte et rétention', () => {
  assert.deepEqual(countsFor({ e: 'open', track: 'new', newPlayer: true, retDay: null }), { c: { open: { new: 1 } }, cohort: { n: 1 } });
  assert.deepEqual(countsFor({ e: 'open', track: 'debutant', newPlayer: false, retDay: 7 }), { c: { open: { debutant: 1 } }, ret: { d7: 1 } });
});

test('événement level_end : réussite, étoiles et discipline par niveau et par profil', () => {
  const c = countsFor({ e: 'level_end', track: 'debutant', levelId: 3, stars: 2, discipline: 74.6, passed: true });
  assert.deepEqual(c, {
    c: { level_end: { debutant: 1 }, level_pass: { debutant: 1 } },
    lv: { '3': { end: 1, stars: 2, disc: 75, pass: 1 } },
    lvt: { debutant: { '3': { end: 1, pass: 1 } } },
  });
  const failed = countsFor({ e: 'level_end', track: 'avance', levelId: 3, stars: 0, discipline: 20, passed: false });
  assert.equal((failed.c as Counts).level_pass, undefined);
});

test('événements trade, quit, vitesse, difficulté, test de niveau', () => {
  assert.deepEqual(countsFor({ e: 'trade', track: 'debutant', levelId: 1, reason: 'too_early', compliant: false }), {
    c: { trade: { debutant: 1 } }, why: { too_early: { debutant: 1 } }, lv: { '1': { trade_bad: 1 } },
  });
  assert.deepEqual(countsFor({ e: 'level_quit', track: 'new', levelId: 1 }), { c: { level_quit: { new: 1 } }, lv: { '1': { quit: 1 } }, lvt: { new: { '1': { quit: 1 } } } });
  assert.deepEqual(countsFor({ e: 'speed', track: 'debutant', to: 0.5 }), { spd: { '0_5': { debutant: 1 } } });
  assert.deepEqual(countsFor({ e: 'rate', track: 'avance', levelId: 33, v: 'easy' }), { diff: { '33': { easy: 1 } }, diffT: { avance: { easy: 1 } } });
  assert.deepEqual(countsFor({ e: 'diag_answer', qid: 'rr', result: 'wrong' }), { dq: { rr: { wrong: 1 } } });
  assert.deepEqual(countsFor({ e: 'diag_done', correct: 5, place: 'intermediaire' }), { diag: { score: { '5': 1 }, place: { intermediaire: 1 } } });
});

test('dailyOf ne garde que les courbes dans le temps ; isEmptyCounts', () => {
  const c: Counts = { c: { open: { new: 1 } }, lv: { '1': { start: 1 } }, cohort: { n: 1 }, ret: { d1: 1 }, why: { x: { new: 1 } } };
  assert.deepEqual(Object.keys(dailyOf(c)).sort(), ['c', 'cohort', 'ret']);
  assert.ok(isEmptyCounts({}));
  assert.equal(isEmptyCounts({ a: 1 }), false);
});

import { buildReport, num, reportToText } from '../src/core/services/statsReport';

test('rapport : lit les compteurs sans rien inventer', () => {
  const stats: Counts = {
    cohort: { n: 4 }, ret: { d1: 1 },
    c: { open: { debutant: 3, new: 1 }, level_start: { debutant: 5 }, level_end: { debutant: 4 }, level_pass: { debutant: 3 }, level_quit: { debutant: 1 }, trade: { debutant: 9 } },
    diag: { score: { '5': 2 }, place: { intermediaire: 2 } },
    lv: { '1': { start: 5, end: 4, pass: 3, quit: 1, disc: 300 } },
    diff: { '1': { easy: 1, hard: 2 } },
    why: { too_early: { debutant: 4 }, ok_zone: { debutant: 5 } },
  };
  assert.equal(num(stats, 'c', 'open', 'debutant'), 3);
  assert.equal(num(stats, 'c', 'inconnu', 'x'), 0);
  const text = reportToText(buildReport(stats));
  assert.ok(text.includes('Nouveaux joueurs comptés : 4'));
  assert.ok(text.includes('Reviennent à J1 : 1 (25 %)'));
  assert.ok(text.includes('Niveau 1 : 5 lancés · 4 finis · réussite 75 % · abandons 1 · discipline moy. 75 %'));
  assert.ok(text.includes('too_early : 4'));
  assert.ok(!text.includes('ok_zone'));
  assert.ok(buildReport({}).every((s) => s.lines.length > 0));
});

test('leçon 0 et provenance : uniquement sous la clé « c » (règles Firestore publiées)', () => {
  const allowed = new Set(['c', 'lv', 'lvt', 'why', 'diff', 'diffT', 'dq', 'diag', 'cohort', 'ret', 'spd']);
  const evs = [
    { e: 'lesson_start', track: 'debutant' }, { e: 'lesson_done', track: 'debutant', correct: 2 },
    { e: 'lesson_skip', track: 'new' }, { e: 'source', v: 'social' },
    { e: 'open', track: 'new', newPlayer: true, retDay: 1 }, { e: 'level_start', track: 'avance', levelId: 2 },
    { e: 'trade', track: 'avance', levelId: 2, reason: 'ok_zone', compliant: true }, { e: 'speed', track: 'new', to: 0.5 },
    { e: 'rate', track: 'new', levelId: 2, v: 'ok' }, { e: 'diag_answer', qid: 'rr', result: 'right' }, { e: 'diag_done', correct: 3, place: 'debutant' },
    { e: 'level_end', track: 'new', levelId: 1, stars: 1, discipline: 50, passed: true }, { e: 'quiz_end', track: 'new', levelId: 25, stars: 1 },
  ] as const;
  for (const ev of evs) for (const k of Object.keys(countsFor(ev as never))) assert.ok(allowed.has(k), `clé non autorisée : ${k} (${ev.e})`);
  assert.deepEqual(countsFor({ e: 'lesson_done', track: 'debutant', correct: 2 }), { c: { lesson_done: { debutant: 1 }, lesson_score: { '2': 1 } } });
  assert.deepEqual(countsFor({ e: 'source', v: 'social' }), { c: { source: { social: 1 } } });
});
