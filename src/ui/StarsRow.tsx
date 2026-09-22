import React, { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ND } from './anim';
import { COLORS } from './theme';

/**
 * Rangée d'étoiles. En mode `animate`, chaque étoile gagnée « claque » à tour de rôle
 * et `onStar(i)` est appelé à ce moment précis (pour le son et la vibration).
 */
export function StarsRow({ value, size = 44, animate = false, onStar }: { value: number; size?: number; animate?: boolean; onStar?: (i: number) => void }) {
  const scales = useMemo(() => [0, 1, 2].map(() => new Animated.Value(animate ? 0.2 : 1)), [animate]);

  useEffect(() => {
    if (!animate) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    scales.forEach((s, i) => {
      if (i >= value) { s.setValue(1); return; }
      timers.push(
        setTimeout(() => {
          onStar?.(i);
          Animated.spring(s, { toValue: 1, friction: 3, tension: 140, useNativeDriver: ND }).start();
        }, 450 + i * 420),
      );
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, value, scales]);

  return (
    <View style={styles.row} accessibilityLabel={`${value} / 3`}>
      {scales.map((s, i) => {
        const on = i < value;
        return (
          <Animated.Text key={i} style={[styles.star, { fontSize: size, color: on ? COLORS.gold : COLORS.line, transform: [{ scale: on ? s : 1 }] }]}>
            {on ? '★' : '☆'}
          </Animated.Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  star: { textAlign: 'center' },
});
