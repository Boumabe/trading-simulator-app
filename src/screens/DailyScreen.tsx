import React, { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';
import { dailyNumber, dailyStatus, dailyUnlocked, pickDaily, variantFor, type DailyPlay } from '../core/daily';
import { useGame } from '../core/store/game';
import { dayKey } from '../core/store/logic';
import PlayScreen from './PlayScreen';

/**
 * Défi du jour : choisit le niveau du jour (le même pour tous), le décline en variante, et lance l'écran de jeu en mode défi.
 * La clé du jour est figée à l'ouverture : un défi commencé avant minuit se termine sur le même graphique.
 */
export default function DailyScreen() {
  const router = useRouter();
  const game = useGame();
  const key = useMemo(() => dayKey(Date.now()), []);
  /* L'accès est jugé UNE seule fois, à l'ouverture : une fois le défi validé, l'état passe à « terminé » et ne doit pas fermer l'écran de résultat. */
  const entry = useRef<boolean | null>(null);
  if (entry.current === null && game.ready) entry.current = dailyStatus(game.challenge, key, dailyUnlocked(game)) === 'ready';
  const allowed = entry.current === true;
  useEffect(() => { if (game.ready && entry.current === false) router.replace('/map'); }, [game.ready, router]);

  const play = useMemo(() => {
    const { level, number } = pickDaily(key);
    const v = variantFor(level, key);
    const daily: DailyPlay = { key, number: dailyNumber(key), id: v.id, cfg: v.cfg };
    return { level, daily, number };
  }, [key]);

  if (!allowed) return null;
  return <PlayScreen levelId={play.level.id} daily={play.daily} />;
}
