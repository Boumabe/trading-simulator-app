import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../core/i18n';
import type { TradeResult } from '../core/engine/rules';
import { ND } from './anim';
import { COLORS, RADIUS, money } from './theme';

export interface FeedbackData { id: number; trade: TradeResult; xp: number; combo: number; delta: number }

/** Carte qui explique chaque trade : pourquoi il est conforme (ou non), ce qu'il rapporte, le combo en cours. */
export function TradeFeedback({ data, onDone }: { data: FeedbackData; onDone: () => void }) {
  const { t } = useI18n();
  const v = useRef(new Animated.Value(0)).current;
  const ok = data.trade.compliant;

  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 6, tension: 110, useNativeDriver: ND }).start();
    const id = setTimeout(() => Animated.timing(v, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: ND }).start(onDone), 3200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.card, { borderColor: ok ? COLORS.bull : COLORS.bear, opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}
    >
      <Text style={[styles.icon, { color: ok ? COLORS.bull : COLORS.bear }]}>{ok ? '✓' : '✕'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{t(ok ? 'trade_good' : 'trade_bad')}</Text>
        <Text style={styles.why}>{t(`why_${data.trade.reason}`)}</Text>
        {data.combo >= 2 && ok ? <Text style={styles.combo}>🔥 {t('combo_x', { n: data.combo })}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.net, { color: data.delta >= 0 ? COLORS.bull : COLORS.bear }]}>{money(data.delta, true)}</Text>
        {data.xp > 0 ? <Text style={styles.xp}>+{data.xp} XP</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.panelAlt, borderWidth: 1.5, borderRadius: RADIUS.lg, padding: 12, marginHorizontal: 12, marginBottom: 8 },
  icon: { fontSize: 30, fontWeight: '900', width: 30, textAlign: 'center' },
  title: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  why: { color: COLORS.dim, fontSize: 12, marginTop: 2, lineHeight: 16 },
  combo: { color: COLORS.warn, fontSize: 12, fontWeight: '800', marginTop: 3 },
  net: { fontSize: 18, fontWeight: '900' },
  xp: { color: COLORS.gold, fontSize: 11, fontWeight: '800', marginTop: 2 },
});
