import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../core/i18n';
import { haptic, reward } from '../core/services/feedback';
import { Btn } from './Button';
import { Burst } from './Burst';
import { StarsRow } from './StarsRow';
import { ND, useCountUp } from './anim';
import { COLORS, FILL, RADIUS } from './theme';

export interface ResultStat { label: string; value: string; color?: string }

export interface ResultProps {
  title: string;
  passed: boolean;
  stars: number;
  xp: number;
  improved: boolean;
  stats: ResultStat[];
  note?: string;
  onReplay: () => void;
  onNext?: () => void;
  onMap: () => void;
}

/** Fin de niveau : étoiles qui claquent une à une, confettis, XP qui monte, sons et vibrations. */
export function ResultOverlay(p: ResultProps) {
  const { t } = useI18n();
  const scale = useRef(new Animated.Value(0.85)).current;
  const [burst, setBurst] = useState(0);
  const xp = useCountUp(p.xp, 900);

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 6, tension: 100, useNativeDriver: ND }).start();
    if (p.passed) {
      const id = setTimeout(() => setBurst(1), 400 + Math.max(1, p.stars) * 420);
      return () => clearTimeout(id);
    }
    reward.lose();
  }, [p.passed, p.stars, scale]);

  return (
    <View style={styles.overlay}>
      <Burst trigger={burst} kind={p.stars === 3 ? 'stars' : 'confetti'} count={p.stars === 3 ? 22 : 34} />
      <Animated.View style={[styles.card, { transform: [{ scale }] }, p.passed && { borderColor: COLORS.gold }]}>
        <ScrollView contentContainerStyle={{ alignItems: 'center' }} showsVerticalScrollIndicator={false}>
          <Text style={[styles.eyebrow, { color: p.passed ? COLORS.gold : COLORS.bear }]}>{t(p.passed ? 'result_passed' : 'result_failed')}</Text>
          <Text style={styles.title}>{p.title}</Text>
          <StarsRow value={p.stars} animate={p.passed} onStar={(i) => { reward.win(); haptic(i === 2 ? 'heavy' : 'medium'); }} />
          <View style={styles.stats}>
            {p.stats.map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={[styles.statValue, s.color ? { color: s.color } : null]}>{s.value}</Text>
              </View>
            ))}
          </View>
          {p.xp > 0 ? <Text style={styles.xp}>+{Math.round(xp)} XP {p.improved ? '🚀' : ''}</Text> : null}
          <Text style={styles.note}>{p.note ?? t(p.passed ? 'play_discipline_note' : 'result_fail_tip')}</Text>
          {p.passed && p.onNext ? <Btn label={t('result_next')} onPress={p.onNext} style={styles.btn} /> : null}
          <Btn label={t('play_replay')} onPress={p.onReplay} variant={p.passed && p.onNext ? 'ghost' : 'gold'} style={styles.btn} />
          <Btn label={t('play_back_to_map')} onPress={p.onMap} variant="ghost" style={styles.btn} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...FILL, backgroundColor: 'rgba(10,11,22,0.94)', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 40 },
  card: { width: '100%', maxWidth: 400, maxHeight: '92%', backgroundColor: COLORS.panel, borderWidth: 1.5, borderColor: COLORS.line, borderRadius: RADIUS.lg, padding: 22 },
  eyebrow: { fontSize: 11, letterSpacing: 2.2, fontWeight: '900', textAlign: 'center' },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginTop: 4, marginBottom: 14, textAlign: 'center' },
  stats: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-around', marginTop: 18 },
  stat: { alignItems: 'center', flex: 1 },
  statLabel: { color: COLORS.dim, fontSize: 10, letterSpacing: 1 },
  statValue: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginTop: 4 },
  xp: { color: COLORS.gold, fontSize: 22, fontWeight: '900', marginTop: 14 },
  note: { color: COLORS.dim, fontSize: 12, lineHeight: 17, textAlign: 'center', marginVertical: 14 },
  btn: { alignSelf: 'stretch', marginTop: 8 },
});
