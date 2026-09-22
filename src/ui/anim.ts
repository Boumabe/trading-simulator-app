import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform } from 'react-native';

/** Le driver natif n'existe pas sur le web : on l'active seulement sur mobile. */
export const ND = Platform.OS !== 'web';

/** Valeur qui glisse en douceur vers la cible (décompte de capital, XP…). */
export function useCountUp(target: number, ms = 700): number {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const a = from.current;
    if (a === target) return;
    const start = Date.now();
    let raf = 0;
    const step = () => {
      const p = Math.min(1, (Date.now() - start) / ms);
      const cur = a + (target - a) * (1 - Math.pow(1 - p, 3));
      from.current = cur;
      setV(cur);
      if (p < 1) raf = requestAnimationFrame(step);
      else { from.current = target; setV(target); }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/** Pulsation en boucle (nœud recommandé, coffre, bouton principal). */
export function usePulse(active = true, to = 1.07, ms = 850): Animated.Value {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) { v.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: to, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: ND }),
        Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: ND }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, to, ms, v]);
  return v;
}

/** Secousse horizontale (mauvaise réponse, niveau verrouillé, pénalité). */
export function useShake(): { x: Animated.Value; shake: () => void } {
  const x = useRef(new Animated.Value(0)).current;
  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(x, { toValue: 9, duration: 55, useNativeDriver: ND }),
      Animated.timing(x, { toValue: -9, duration: 80, useNativeDriver: ND }),
      Animated.timing(x, { toValue: 6, duration: 70, useNativeDriver: ND }),
      Animated.timing(x, { toValue: -4, duration: 60, useNativeDriver: ND }),
      Animated.timing(x, { toValue: 0, duration: 50, useNativeDriver: ND }),
    ]).start();
  }, [x]);
  return useMemo(() => ({ x, shake }), [x, shake]);
}

/** « Pop » : petit rebond d'échelle quand une valeur récompense le joueur. */
export function usePop(): { scale: Animated.Value; pop: () => void } {
  const scale = useRef(new Animated.Value(1)).current;
  const pop = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.22, duration: 110, useNativeDriver: ND }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 160, useNativeDriver: ND }),
    ]).start();
  }, [scale]);
  return useMemo(() => ({ scale, pop }), [scale, pop]);
}
