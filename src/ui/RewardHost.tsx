import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../core/i18n';
import { useActions, useGame } from '../core/store/game';
import type { Banner } from '../core/store/logic';
import { haptic, reward } from '../core/services/feedback';
import { Burst } from './Burst';
import { ND } from './anim';
import { COLORS, RADIUS } from './theme';

function BannerCard({ banner, top, onDone }: { banner: Banner; top: number; onDone: () => void }) {
  const { t } = useI18n();
  const y = useRef(new Animated.Value(-170)).current;

  useEffect(() => {
    if (banner.kind === 'rank') { reward.win(); haptic('heavy'); } else if (banner.kind === 'streak') reward.coin(); else reward.win();
    Animated.spring(y, { toValue: 0, friction: 6, tension: 90, useNativeDriver: ND }).start();
    const out = setTimeout(() => {
      Animated.timing(y, { toValue: -170, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: ND }).start(onDone);
    }, banner.kind === 'rank' ? 3800 : 3000);
    return () => clearTimeout(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.wrap, { top, transform: [{ translateY: y }] }]} pointerEvents="box-none">
      <Pressable onPress={onDone} accessibilityRole="alert" accessibilityLabel={t(banner.titleKey, banner.titleParams)} style={styles.card}>
        <View style={styles.burstBox} pointerEvents="none"><Burst trigger={1} kind={banner.kind === 'rank' ? 'confetti' : 'stars'} count={banner.kind === 'rank' ? 30 : 14} /></View>
        <Text style={styles.icon}>{banner.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{t(banner.eyebrowKey)}</Text>
          <Text style={styles.title}>{t(banner.titleKey, banner.titleParams)}</Text>
          {banner.subKey ? <Text style={styles.sub}>{t(banner.subKey)}</Text> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** Affiche, une par une, les récompenses en attente (succès, nouveau rang, série de jours). */
export function RewardHost() {
  const { queue } = useGame();
  const { dismissBanner } = useActions();
  const insets = useSafeAreaInsets();
  const b = queue[0];
  if (!b) return null;
  return <BannerCard key={b.id} banner={b} top={insets.top + 8} onDone={() => dismissBanner(b.id)} />;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 100 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.panelAlt, borderWidth: 1.5, borderColor: COLORS.gold, borderRadius: RADIUS.lg, padding: 14, overflow: 'visible' },
  burstBox: { position: 'absolute', left: 30, top: 28, width: 1, height: 1 },
  icon: { fontSize: 34 },
  eyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 1.6, fontWeight: '800' },
  title: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginTop: 1 },
  sub: { color: COLORS.dim, fontSize: 12, marginTop: 2 },
});
