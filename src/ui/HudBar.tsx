import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../core/i18n';
import { useActions, useGame } from '../core/store/game';
import { liveStreak, refillAvailable } from '../core/store/logic';
import { rankOf } from '../core/store/ranks';
import { reward } from '../core/services/feedback';
import { Btn } from './Button';
import { ND, useCountUp, usePop } from './anim';
import { COLORS, RADIUS, money } from './theme';

function Floating({ amount, onDone }: { amount: number; onDone: () => void }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 1300, useNativeDriver: ND }).start(onDone);
  }, [v, onDone]);
  return (
    <Animated.Text
      pointerEvents="none"
      style={[styles.float, {
        color: amount >= 0 ? COLORS.bull : COLORS.bear,
        opacity: v.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -38] }) }, { scale: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.25, 1] }) }],
      }]}
    >
      {money(amount, true)}
    </Animated.Text>
  );
}

/** Barre de capital : décompte animé, gains flottants, série de jours et rang avec barre d'XP. */
export function HudBar({ liveDelta = 0, compact = false, onPress }: { liveDelta?: number; compact?: boolean; onPress?: () => void }) {
  const s = useGame();
  const { refill } = useActions();
  const { t } = useI18n();
  const display = s.balance + liveDelta;
  const shown = useCountUp(display, 650);
  const rank = rankOf(s.xp);
  const xpBar = useCountUp(rank.progress, 700);
  const streak = liveStreak(s, Date.now());
  const pop = usePop();
  const lastId = useRef(s.walletEvent?.id ?? 0);
  const [floats, setFloats] = useState<{ id: number; amount: number }[]>([]);

  useEffect(() => {
    const ev = s.walletEvent;
    if (ev && ev.id !== lastId.current) {
      lastId.current = ev.id;
      pop.pop();
      setFloats((f) => [...f, ev]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.walletEvent]);

  const broke = display <= 0;
  const color = broke ? COLORS.bear : liveDelta > 0 ? COLORS.bull : liveDelta < 0 ? COLORS.bear : COLORS.gold;
  const canRefill = refillAvailable(s, Date.now());

  return (
    <View style={[styles.bar, broke && styles.barBroke]} accessibilityRole="header">
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('capital_label')}</Text>
          <View>
            <Animated.Text
              onPress={onPress}
              accessibilityLabel={`${t('capital_label')} ${money(display)}`}
              style={[compact ? styles.valueSm : styles.value, { color, transform: [{ scale: pop.scale }] }]}
            >
              {money(Math.max(0, shown))}
            </Animated.Text>
            {floats.map((f) => (
              <Floating key={f.id} amount={f.amount} onDone={() => setFloats((x) => x.filter((y) => y.id !== f.id))} />
            ))}
          </View>
        </View>
        <View style={styles.chips}>
          {streak > 0 && (
            <View style={styles.chip} accessibilityLabel={t('streak_days', { n: streak })}>
              <Text style={styles.chipText}>🔥 {streak}</Text>
            </View>
          )}
          <View style={[styles.chip, { borderColor: COLORS.gold }]}>
            <Text style={[styles.chipText, { color: COLORS.gold }]}>{t(rank.key)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.xpTrack} accessibilityLabel={`XP ${s.xp}`}>
        <View style={[styles.xpFill, { width: `${Math.round(xpBar * 100)}%` }]} />
      </View>
      {!compact && (
        <Text style={styles.xpText}>{rank.next === null ? `${s.xp} XP · MAX` : `${s.xp} / ${rank.next} XP`}</Text>
      )}
      {broke && (
        <View style={styles.brokeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brokeText}>{t('capital_broke')}</Text>
            <Text style={styles.brokeSub}>{canRefill ? t('refill_sub') : t('capital_broke_sub')}</Text>
          </View>
          {canRefill && <Btn small label={t('refill_button')} onPress={() => { reward.coin(); refill(); }} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: COLORS.panel, borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  barBroke: { backgroundColor: '#1F1420', borderBottomColor: COLORS.bear },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { color: COLORS.dim, fontSize: 10, letterSpacing: 1.5 },
  value: { fontSize: 38, fontWeight: '800', letterSpacing: 0.3 },
  valueSm: { fontSize: 26, fontWeight: '800' },
  float: { position: 'absolute', left: 4, top: 0, fontSize: 18, fontWeight: '800' },
  chips: { alignItems: 'flex-end', gap: 6 },
  chip: { borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  xpTrack: { height: 5, backgroundColor: COLORS.panelAlt, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  xpFill: { height: 5, backgroundColor: COLORS.gold, borderRadius: 3 },
  xpText: { color: COLORS.dim, fontSize: 10, marginTop: 4, textAlign: 'right' },
  brokeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  brokeText: { color: COLORS.bear, fontSize: 13, fontWeight: '800' },
  brokeSub: { color: COLORS.dim, fontSize: 11, marginTop: 1 },
});
