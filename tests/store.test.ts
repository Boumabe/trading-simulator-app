import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, applyTrade, completeLevel, completeQuiz, claimDaily, dailyAvailable, dailyReward, liveStreak, refill, refillAvailable, migrateLegacy, sanitize, isUnlocked, dayKey, resetAll } from '../src/core/store/logic';
import { rankOf } from '../src/core/store/ranks';
import type { TradeResult } from '../src/core/engine/rules';

const T0 = new Date(2026, 8, 21, 10, 0, 0).getTime();
const DAY = 86400000;
const trade = (over: Partial<TradeResult> = {}): TradeResult => ({
  type: 'buy', entryPrice: 100, exitPrice: 110, entryClosed: 1, exitClosed: 5, pnl: 10, compliant: true, reason: 'ok_zone', net: 15, ...over,
});
const ready = () => ({ ...initialState(), ready: true });

test('trade conforme : capital, XP, succès « premier trade »', () => {
  const r = applyTrade(ready(), { trade: trade(), combo: 1, levelId: 1, now: T0 });
  assert.equal(r.state.balance, 115);
  assert.equal(r.result.xp, 10);
  assert.ok(r.state.achievements.first_trade && r.state.achievements.rule_follower);
  assert.ok(r.state.queue.length >= 2);
  assert.equal(r.state.walletEvent?.amount, 15);
});

test('capital : plancher à 0, jamais négatif (bug #7)', () => {
  const s = { ...ready(), balance: 3 };
  const r = applyTrade(s, { trade: trade({ compliant: false, pnl: -365, net: -375 }), combo: 0, levelId: 1, now: T0 });
  assert.equal(r.state.balance, 0);
  assert.equal(r.result.delta, -3);
});

test('recharge de secours : 1 par jour, seulement si capital bas', () => {
  const broke = { ...ready(), balance: 0 };
  assert.ok(refillAvailable(broke, T0));
  const r = refill(broke, T0);
  assert.equal(r.result, true);
  assert.equal(r.state.balance, 50);
  assert.equal(refill({ ...r.state, balance: 0 }, T0).result, false);
  assert.ok(refillAvailable({ ...r.state, balance: 0 }, T0 + DAY));
  assert.equal(refillAvailable(ready(), T0), false);
});

test('rejouer un niveau maîtrisé réduit les gains (anti-farm)', () => {
  let s = ready();
  s = { ...s, levels: { 1: { stars: 3, best: 3, plays: 5, passes: 5 } } };
  const r = applyTrade(s, { trade: trade({ net: 100 }), combo: 1, levelId: 1, now: T0 });
  assert.equal(r.state.balance, 125);
});

test('niveau : validation seulement avec ≥1 trade et discipline ≥ 50 %', () => {
  assert.equal(completeLevel(ready(), { levelId: 1, discipline: 0, trades: 0, now: T0 }).result.passed, false);
  assert.equal(completeLevel(ready(), { levelId: 1, discipline: 40, trades: 5, now: T0 }).result.passed, false);
  const ok = completeLevel(ready(), { levelId: 1, discipline: 100, trades: 2, now: T0 });
  assert.equal(ok.result.stars, 3);
  assert.ok(ok.result.xp > 0 && ok.state.levels[1].stars === 3);
  assert.ok(ok.state.achievements.clean_sheet);
});

test('niveau : améliorer ses étoiles ne rapporte que la différence d’XP', () => {
  const a = completeLevel(ready(), { levelId: 2, discipline: 50, trades: 2, now: T0 });
  const b = completeLevel(a.state, { levelId: 2, discipline: 100, trades: 2, now: T0 });
  const c = completeLevel(b.state, { levelId: 2, discipline: 100, trades: 2, now: T0 });
  assert.ok(b.result.xp > 0);
  assert.equal(c.result.xp, 0);
});

test('quiz : 0 bonne réponse ne valide pas (bug #1 côté quiz)', () => {
  assert.equal(completeQuiz(ready(), { levelId: 25, correct: 0, total: 2, now: T0 }).result.passed, false);
  assert.equal(completeQuiz(ready(), { levelId: 25, correct: 2, total: 2, now: T0 }).result.stars, 3);
});

test('déblocage : suivant seulement après validation réelle', () => {
  const s = ready();
  assert.equal(isUnlocked(s, 2, 1), false);
  assert.equal(isUnlocked(s, 8, 8), true);
  const done = completeLevel(s, { levelId: 1, discipline: 100, trades: 1, now: T0 }).state;
  assert.equal(isUnlocked(done, 2, 1), true);
  const failed = completeLevel(s, { levelId: 1, discipline: 0, trades: 0, now: T0 }).state;
  assert.equal(isUnlocked(failed, 2, 1), false);
});

test('coffre du jour : série, plafond, un seul par jour', () => {
  let s = ready();
  const c1 = claimDaily(s, T0);
  assert.equal(c1.result?.reward, 5);
  assert.equal(c1.result?.streak, 1);
  s = c1.state;
  assert.equal(claimDaily(s, T0 + 3600000).result, null);
  const c2 = claimDaily(s, T0 + DAY);
  assert.equal(c2.result?.streak, 2);
  assert.equal(c2.result?.reward, 7);
  s = c2.state;
  const skip = claimDaily(s, T0 + 3 * DAY);
  assert.equal(skip.result?.streak, 1);
  assert.equal(dailyReward(99), 15);
  assert.equal(liveStreak(c2.state, T0 + 5 * DAY), 0);
  assert.equal(liveStreak(c2.state, T0 + DAY), 2);
});

test('coffre du jour : reculer l’horloge ne permet pas de le rejouer (bug #12)', () => {
  const claimed = claimDaily(ready(), T0 + 3 * DAY).state;
  assert.equal(dailyAvailable(claimed, T0 + DAY), false);
  assert.equal(claimDaily(claimed, T0 + DAY).result, null);
});

test('rangs', () => {
  assert.equal(rankOf(0).index, 0);
  assert.equal(rankOf(100).index, 1);
  assert.equal(rankOf(99999).next, null);
  assert.ok(rankOf(200).progress > 0 && rankOf(200).progress < 1);
});

test('migration depuis l’ancienne version', () => {
  assert.equal(migrateLegacy({}), null);
  const m = migrateLegacy({ balance: '-120', completed: '[1,2,3]', tour: '1', checklist: '[4,5]' })!;
  assert.equal(m.balance, 100);
  assert.equal(m.levels[3].stars, 1);
  assert.equal(m.seenTour, true);
  assert.deepEqual(m.checklist, [4, 5]);
  assert.equal(migrateLegacy({ balance: '480' })!.balance, 480);
});

test('sanitize : données corrompues → valeurs sûres', () => {
  const p = sanitize({ balance: 'x', xp: -5, choice: 'zzz', settings: { lang: 'de' }, checklist: [1, 'a'] });
  assert.equal(p.balance, 100);
  assert.equal(p.xp, 0);
  assert.equal(p.choice, null);
  assert.equal(p.settings.lang, 'auto');
  assert.deepEqual(p.checklist, [1]);
  assert.equal(sanitize(null).v, 2);
});

test('reset total conserve les réglages', () => {
  const s = { ...ready(), balance: 500, settings: { sound: false, haptics: true, lang: 'es' as const } };
  const r = resetAll(s);
  assert.equal(r.balance, 100);
  assert.equal(r.settings.lang, 'es');
  assert.equal(dayKey(T0), '2026-09-21');
});
