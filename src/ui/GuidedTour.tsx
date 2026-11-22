import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../core/i18n';
import { Btn } from './Button';
import { ND } from './anim';
import { COLORS, FILL, RADIUS } from './theme';

export interface TourStep {
  id: string;
  title: string;
  text: string;
  /** Élément réel de l'écran à éclairer (null = carte au centre, sans projecteur). */
  target: React.RefObject<View | null> | null;
}

interface Rect { x: number; y: number; w: number; h: number }
const PAD = 6;
const DIM = 'rgba(6,7,16,0.85)';

/**
 * Tutoriel guidé : éclaire un à un les vrais éléments de l'écran (prix, bougies, règle, boutons…).
 * Les positions sont mesurées par rapport à `rootRef` ; si une mesure échoue, la carte s'affiche au centre sans projecteur.
 */
export function GuidedTour({ steps, rootRef, onStep, onEnd }: {
  steps: TourStep[];
  rootRef: React.RefObject<View | null>;
  onStep?: (index: number) => void;
  onEnd: (how: 'done' | 'skip') => void;
}) {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const glow = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: ND }),
        Animated.timing(glow, { toValue: 0.45, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: ND }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  useEffect(() => {
    onStep?.(i);
    setRect(null);
    const target = steps[i].target?.current;
    const root = rootRef.current;
    if (!target || !root) return;
    const id = setTimeout(() => {
      try {
        (target as unknown as { measureLayout: (r: unknown, ok: (x: number, y: number, w: number, h: number) => void, fail: () => void) => void })
          .measureLayout(root, (x, y, w, h) => setRect(w > 0 && h > 0 ? { x, y, w, h } : null), () => setRect(null));
      } catch {
        setRect(null);
      }
    }, 80);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const step = steps[i];
  const last = i === steps.length - 1;
  const hole = rect ? { x: Math.max(0, rect.x - PAD), y: Math.max(0, rect.y - PAD), w: rect.w + PAD * 2, h: rect.h + PAD * 2 } : null;
  const cardBelow = hole ? hole.y + hole.h / 2 < box.h / 2 : true;

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {hole ? (
        <>
          <View style={[styles.dim, { top: 0, left: 0, right: 0, height: hole.y }]} />
          <View style={[styles.dim, { top: hole.y + hole.h, left: 0, right: 0, bottom: 0 }]} />
          <View style={[styles.dim, { top: hole.y, left: 0, width: hole.x, height: hole.h }]} />
          <View style={[styles.dim, { top: hole.y, left: hole.x + hole.w, right: 0, height: hole.h }]} />
          <Animated.View pointerEvents="none" style={[styles.ring, { top: hole.y, left: hole.x, width: hole.w, height: hole.h, opacity: glow }]} />
        </>
      ) : (
        <View style={[styles.dim, FILL]} />
      )}
      <View style={[styles.card, hole ? (cardBelow ? { top: hole.y + hole.h + 14 } : { bottom: box.h - hole.y + 14 }) : { top: '28%' }]}>
        <Text style={styles.eyebrow}>{i + 1} / {steps.length}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.text}>{step.text}</Text>
        <View style={styles.row}>
          {last ? <View /> : <Btn variant="ghost" small label={t('tour_skip')} onPress={() => onEnd('skip')} />}
          <Btn small label={last ? t('tour_start') : t('tour_next')} onPress={() => (last ? onEnd('done') : setI((v) => v + 1))} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...FILL, zIndex: 30 },
  dim: { position: 'absolute', backgroundColor: DIM },
  ring: { position: 'absolute', borderWidth: 2.5, borderColor: COLORS.gold, borderRadius: 12 },
  card: { position: 'absolute', left: 16, right: 16, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.gold, borderRadius: RADIUS.lg, padding: 18 },
  eyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  title: { color: COLORS.text, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  text: { color: COLORS.dim, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
