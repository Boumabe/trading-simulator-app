import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import type { TradeResult } from '../engine/rules';
import type { StartChoice } from '../data/levels';
import { setFeedbackPrefs } from '../services/feedback';
import { persistAndFlush, restorePending, setAnalyticsEnabled, track, type SourceValue, type Track } from '../services/analytics';
import {
  applyPlacement, applyTrade, claimDaily, completeLevel, completeQuiz, dismissBanner, finishLesson as finishLessonState, initialState, refill, resetAll, resetCapital,
  retentionTick, toPersisted, toggleChecklist, touchClock, type DailyReward, type GameState, type LevelResult, type Persisted, type TradeReward,
} from './logic';
import { loadPersisted, savePersisted, wipeStorage } from './storage';

/** Profil utilisé pour répartir les statistiques ('new' = pas encore de profil). */
export const trackOf = (choice: StartChoice | null): Track => choice ?? 'new';

export interface GameActions {
  chooseStart(c: StartChoice): void;
  /** « Je débute totalement » : profil débutant sans test. */
  chooseBeginner(): void;
  /** Réponse à « Comment as-tu connu Simtra ? » (null = question passée). */
  answerSource(v: Exclude<SourceValue, 'skip' | 'social'> | null): void;
  /** Leçon 0 terminée (nombre de bonnes réponses) ou passée. */
  finishLesson(a: { correct: number }): void;
  skipLesson(): void;
  /** Résultat du test de niveau. */
  choosePlacement(a: { choice: StartChoice; correct: number; total: number }): void;
  recordTrade(trade: TradeResult, combo: number, levelId: number): TradeReward;
  finishLevel(a: { levelId: number; discipline: number; trades: number; sniperAccuracy?: number }): LevelResult;
  finishQuiz(a: { levelId: number; correct: number; total: number }): LevelResult;
  claimDaily(): DailyReward | null;
  refill(): boolean;
  resetCapital(): void;
  resetAll(): Promise<void>;
  setSettings(patch: Partial<Persisted['settings']>): void;
  markTourSeen(): void;
  toggleChecklist(id: number): void;
  dismissBanner(id: number): void;
}

const StateCtx = createContext<GameState | null>(null);
const ActionsCtx = createContext<GameActions | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<GameState>(initialState());
  const [state, setState] = useState<GameState>(ref.current);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (ref.current.ready) void savePersisted(toPersisted(ref.current));
  }, []);

  const commit = useCallback((next: GameState) => {
    ref.current = next;
    setState(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 300);
  }, [flush]);

  useEffect(() => {
    let alive = true;
    loadPersisted().then((p) => {
      if (!alive) return;
      const now = Date.now();
      commit(touchClock({ ...ref.current, ...p, ready: true }, now));
      SplashScreen.hideAsync().catch(() => {});
      // Mesure anonyme : ouverture, nouveau joueur, rétention J1/J7/J30 (compteurs, aucun identifiant).
      setAnalyticsEnabled(ref.current.settings.analytics);
      void restorePending();
      const rt = retentionTick(ref.current, now);
      commit({ ...ref.current, ...rt.patch });
      // Joueur déjà installé avant la question de provenance : on le range à part (« unknown »), avec son profil.
      if (rt.newPlayer && ref.current.choice !== null) {
        commit({ ...ref.current, source: ref.current.source ?? 'unknown', sourceAsked: true });
        track({ e: 'cohort_src', v: 'unknown' });
        track({ e: 'cohort_trk', v: trackOf(ref.current.choice) });
      }
      track({ e: 'open', track: trackOf(ref.current.choice), source: ref.current.source ?? 'none', newPlayer: rt.newPlayer, retDay: rt.retDay });
    });
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') { flush(); void persistAndFlush(); }
    });
    return () => { alive = false; sub.remove(); flush(); };
  }, [commit, flush]);

  useEffect(() => { setFeedbackPrefs(state.settings); }, [state.settings]);
  useEffect(() => { if (state.ready) setAnalyticsEnabled(state.settings.analytics); }, [state.ready, state.settings.analytics]);

  const actions = useMemo<GameActions>(() => {
    const mutate = <R,>(fn: (s: GameState) => { state: GameState; result: R }): R => {
      const r = fn(ref.current);
      commit(r.state);
      return r.result;
    };
    return {
      chooseStart: (choice) => commit({ ...ref.current, choice }),
      chooseBeginner: () => {
        if (ref.current.choice === null) track({ e: 'cohort_trk', v: 'debutant' });
        commit({ ...ref.current, choice: 'debutant' });
        track({ e: 'beginner_pick' });
      },
      answerSource: (v) => {
        commit({ ...ref.current, sourceAsked: true, source: v ?? 'skip' });
        track({ e: 'source', v: v ?? 'skip' });
        track({ e: 'cohort_src', v: v ?? 'skip' });
      },
      finishLesson: (a) => {
        commit(finishLessonState(ref.current));
        track({ e: 'lesson_done', track: trackOf(ref.current.choice), correct: a.correct });
      },
      skipLesson: () => {
        commit(finishLessonState(ref.current));
        track({ e: 'lesson_skip', track: trackOf(ref.current.choice) });
      },
      choosePlacement: (a) => {
        if (ref.current.choice === null) track({ e: 'cohort_trk', v: a.choice });
        commit(applyPlacement(ref.current, { ...a, now: Date.now() }));
        track({ e: 'diag_done', correct: a.correct, place: a.choice });
      },
      recordTrade: (trade, combo, levelId) => {
        const before = ref.current.balance;
        const r = mutate((s) => applyTrade(s, { trade, combo, levelId, now: Date.now() }));
        const tk = trackOf(ref.current.choice);
        track({ e: 'trade', track: tk, levelId, reason: trade.reason, compliant: trade.compliant });
        if (before > 0 && ref.current.balance <= 0) track({ e: 'broke', track: tk });
        return r;
      },
      finishLevel: (a) => {
        const r = mutate((s) => completeLevel(s, { ...a, now: Date.now() }));
        track({ e: 'level_end', track: trackOf(ref.current.choice), levelId: a.levelId, stars: r.stars, discipline: a.discipline, passed: r.passed });
        return r;
      },
      finishQuiz: (a) => {
        const r = mutate((s) => completeQuiz(s, { ...a, now: Date.now() }));
        track({ e: 'quiz_end', track: trackOf(ref.current.choice), levelId: a.levelId, stars: r.stars });
        return r;
      },
      claimDaily: () => mutate((s) => claimDaily(s, Date.now())),
      refill: () => {
        const ok = mutate((s) => refill(s, Date.now()));
        if (ok) track({ e: 'refill', track: trackOf(ref.current.choice) });
        return ok;
      },
      resetCapital: () => commit(resetCapital(ref.current)),
      resetAll: async () => {
        await wipeStorage();
        commit(resetAll(ref.current));
      },
      setSettings: (patch) => commit({ ...ref.current, settings: { ...ref.current.settings, ...patch } }),
      markTourSeen: () => commit({ ...ref.current, seenTour: true }),
      toggleChecklist: (id) => commit(toggleChecklist(ref.current, id)),
      dismissBanner: (id) => commit(dismissBanner(ref.current, id)),
    };
  }, [commit]);

  return (
    <ActionsCtx.Provider value={actions}>
      <StateCtx.Provider value={state}>{children}</StateCtx.Provider>
    </ActionsCtx.Provider>
  );
}

export function useGame(): GameState {
  const v = useContext(StateCtx);
  if (!v) throw new Error('useGame doit être utilisé dans <GameProvider>');
  return v;
}

export function useActions(): GameActions {
  const v = useContext(ActionsCtx);
  if (!v) throw new Error('useActions doit être utilisé dans <GameProvider>');
  return v;
}
