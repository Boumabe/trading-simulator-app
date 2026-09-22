import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import type { TradeResult } from '../engine/rules';
import type { StartChoice } from '../data/levels';
import { setFeedbackPrefs } from '../services/feedback';
import {
  applyTrade, claimDaily, completeLevel, completeQuiz, dismissBanner, initialState, refill, resetAll, resetCapital,
  toPersisted, toggleChecklist, touchClock, type DailyReward, type GameState, type LevelResult, type Persisted, type TradeReward,
} from './logic';
import { loadPersisted, savePersisted, wipeStorage } from './storage';

export interface GameActions {
  chooseStart(c: StartChoice): void;
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
      commit(touchClock({ ...ref.current, ...p, ready: true }, Date.now()));
      SplashScreen.hideAsync().catch(() => {});
    });
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') flush();
    });
    return () => { alive = false; sub.remove(); flush(); };
  }, [commit, flush]);

  useEffect(() => { setFeedbackPrefs(state.settings); }, [state.settings]);

  const actions = useMemo<GameActions>(() => {
    const mutate = <R,>(fn: (s: GameState) => { state: GameState; result: R }): R => {
      const r = fn(ref.current);
      commit(r.state);
      return r.result;
    };
    return {
      chooseStart: (choice) => commit({ ...ref.current, choice }),
      recordTrade: (trade, combo, levelId) => mutate((s) => applyTrade(s, { trade, combo, levelId, now: Date.now() })),
      finishLevel: (a) => mutate((s) => completeLevel(s, { ...a, now: Date.now() })),
      finishQuiz: (a) => mutate((s) => completeQuiz(s, { ...a, now: Date.now() })),
      claimDaily: () => mutate((s) => claimDaily(s, Date.now())),
      refill: () => mutate((s) => refill(s, Date.now())),
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
