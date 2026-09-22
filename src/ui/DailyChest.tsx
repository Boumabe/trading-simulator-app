import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../core/i18n';
import { useActions } from '../core/store/game';
import type { DailyReward } from '../core/store/logic';
import { haptic, reward } from '../core/services/feedback';
import { Btn } from './Button';
import { Burst } from './Burst';
import { ND, useCountUp, usePulse } from './anim';
import { COLORS, FILL, RADIUS, money } from './theme';

/** Coffre du jour : à ouvrir en touchant. Récompense qui grossit avec la série de jours consécutifs. */
export function DailyChest({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { claimDaily } = useActions();
  const [res, setRes] = useState<DailyReward | null>(null);
  const [opened, setOpened] = useState(false);
  const [burst, setBurst] = useState(0);
  const pulse = usePulse(!opened, 1.1, 500);
  const pop = useRef(new Animated.Value(1)).current;
  const amount = useCountUp(opened && res ? res.reward : 0, 900);

  useEffect(() => {
    if (!opened) return;
    reward.win();
    haptic('heavy');
    setBurst(1);
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.4, duration: 140, useNativeDriver: ND }),
      Animated.spring(pop, { toValue: 1, friction: 3, tension: 130, useNativeDriver: ND }),
    ]).start();
  }, [opened, pop]);

  const open = () => {
    if (opened) return;
    const r = claimDaily();
    if (!r) { onClose(); return; }
    setRes(r);
    setOpened(true);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{t('daily_eyebrow')}</Text>
        <Text style={styles.title}>{opened ? t('daily_opened') : t('daily_title')}</Text>
        <View style={styles.stage}>
          <Burst trigger={burst} kind="coins" count={30} />
          <Animated.Text onPress={open} accessibilityRole="button" accessibilityLabel={t('daily_open')} style={[styles.chest, { transform: [{ scale: opened ? pop : pulse }] }]}>
            {opened ? '💰' : '🎁'}
          </Animated.Text>
        </View>
        {opened && res ? (
          <>
            <Text style={styles.amount}>+{money(amount).replace('$', '$')}</Text>
            <Text style={styles.detail}>{t('daily_streak', { n: res.streak })} · +{res.xp} XP</Text>
            <Btn label={t('daily_great')} onPress={onClose} style={{ alignSelf: 'stretch', marginTop: 16 }} />
          </>
        ) : (
          <>
            <Text style={styles.detail}>{t('daily_hint')}</Text>
            <Btn label={t('daily_open')} onPress={open} style={{ alignSelf: 'stretch', marginTop: 16 }} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...FILL, backgroundColor: 'rgba(10,11,22,0.94)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 },
  card: { width: '100%', maxWidth: 380, backgroundColor: COLORS.panel, borderWidth: 1.5, borderColor: COLORS.gold, borderRadius: RADIUS.lg, padding: 24, alignItems: 'center' },
  eyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginTop: 6 },
  stage: { height: 130, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  chest: { fontSize: 76 },
  amount: { color: COLORS.gold, fontSize: 40, fontWeight: '900' },
  detail: { color: COLORS.dim, fontSize: 13, marginTop: 4, textAlign: 'center' },
});
