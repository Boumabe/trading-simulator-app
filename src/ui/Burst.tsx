import React, { useEffect, useMemo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { ND } from './anim';
import { COLORS } from './theme';

type Kind = 'confetti' | 'coins' | 'stars';
interface P { dx: number; up: number; drop: number; rot: number; size: number; color: string; delay: number; dur: number }

const CONFETTI = [COLORS.gold, COLORS.bull, '#6EA8FF', '#FF6BD6', COLORS.warn, '#FFFFFF'];
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function make(count: number, kind: Kind): P[] {
  return Array.from({ length: count }, () => {
    const angle = rnd(-Math.PI * 0.95, -Math.PI * 0.05);
    const speed = rnd(70, kind === 'coins' ? 150 : 210);
    return {
      dx: Math.cos(angle) * speed * rnd(0.6, 1.3),
      up: -Math.sin(angle) * speed * rnd(0.8, 1.2),
      drop: rnd(60, 220),
      rot: rnd(-540, 540),
      size: kind === 'coins' ? rnd(12, 18) : rnd(6, 11),
      color: kind === 'coins' ? COLORS.gold : CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
      delay: rnd(0, 140),
      dur: rnd(850, 1500),
    };
  });
}

/**
 * Explosion de particules (confettis, pièces, étoiles) qui part du centre du conteneur.
 * Change `trigger` (entier croissant) pour la déclencher ; aucune interaction tactile.
 */
export function Burst({ trigger, kind = 'confetti', count = 26 }: { trigger: number; kind?: Kind; count?: number }) {
  const particles = useMemo(() => (trigger > 0 ? make(count, kind) : []), [trigger, count, kind]);
  const values = useMemo(() => particles.map(() => new Animated.Value(0)), [particles]);

  useEffect(() => {
    if (!particles.length) return;
    const anim = Animated.parallel(
      values.map((v, i) => Animated.timing(v, { toValue: 1, delay: particles[i].delay, duration: particles[i].dur, easing: Easing.out(Easing.cubic), useNativeDriver: ND })),
    );
    anim.start();
    return () => anim.stop();
  }, [values, particles]);

  if (!particles.length) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, i) => {
        const v = values[i];
        const style = {
          position: 'absolute' as const,
          left: '50%' as const,
          top: '50%' as const,
          opacity: v.interpolate({ inputRange: [0, 0.08, 0.75, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
            { translateY: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, -p.up, p.drop] }) },
            { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] }) },
          ],
        };
        if (kind === 'stars') return <Animated.Text key={i} style={[style, { fontSize: p.size + 8 }]}>⭐</Animated.Text>;
        if (kind === 'coins') {
          return (
            <Animated.View key={i} style={[style, { width: p.size, height: p.size, borderRadius: p.size / 2, backgroundColor: p.color, borderWidth: 2, borderColor: '#9BB824' }]} />
          );
        }
        return <Animated.View key={i} style={[style, { width: p.size, height: p.size * 0.6, backgroundColor: p.color, borderRadius: 2 }]} />;
      })}
    </View>
  );
}

