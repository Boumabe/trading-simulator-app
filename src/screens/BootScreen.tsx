import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Redirect } from 'expo-router';
import Svg, { Circle, Line } from 'react-native-svg';
import { loadRemoteLevelNames, useI18n } from '../core/i18n';
import { useGame } from '../core/store/game';
import { ND } from '../ui/anim';
import { COLORS } from '../ui/theme';

/** Écran de démarrage animé ; redirige vers l'onboarding (1re fois) ou la carte dès que la sauvegarde est chargée. */
export default function BootScreen() {
  const { ready, choice } = useGame();
  const { t } = useI18n();
  const [minDone, setMinDone] = useState(false);
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 5, tension: 70, useNativeDriver: ND }).start();
    const id = setTimeout(() => setMinDone(true), 1500);
    loadRemoteLevelNames();
    return () => clearTimeout(id);
  }, [v]);

  if (ready && minDone) return <Redirect href={choice ? '/map' : '/onboarding'} />;

  return (
    <Pressable style={styles.root} onPress={() => setMinDone(true)} accessibilityRole="button" accessibilityLabel="SIMTRA">
      <Animated.View style={{ alignItems: 'center', opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
        <Svg width={110} height={110} viewBox="0 0 120 120">
          <Line x1={60} y1={8} x2={60} y2={38} stroke={COLORS.gold} strokeWidth={2} />
          <Line x1={60} y1={82} x2={60} y2={112} stroke={COLORS.gold} strokeWidth={2} />
          <Line x1={8} y1={60} x2={38} y2={60} stroke={COLORS.gold} strokeWidth={2} />
          <Line x1={82} y1={60} x2={112} y2={60} stroke={COLORS.gold} strokeWidth={2} />
          <Circle cx={60} cy={60} r={30} stroke={COLORS.blue} strokeWidth={1.4} fill="none" opacity={0.6} />
          <Circle cx={60} cy={60} r={5} fill={COLORS.gold} />
        </Svg>
        <Text style={styles.title}>SIMTRA</Text>
        <Text style={styles.tagline}>{t('splash_tagline')}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  title: { color: COLORS.text, fontSize: 32, fontWeight: '800', letterSpacing: 6, marginTop: 20 },
  tagline: { color: COLORS.dim, fontSize: 12, marginTop: 10, textAlign: 'center', paddingHorizontal: 40 },
});
