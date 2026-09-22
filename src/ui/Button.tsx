import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { reward } from '../core/services/feedback';
import { ND } from './anim';
import { COLORS, RADIUS } from './theme';

type Variant = 'gold' | 'bull' | 'bear' | 'ghost';

export function Btn({ label, onPress, variant = 'gold', disabled, style, textStyle, silent, small, accessibilityLabel }: {
  label: string; onPress: () => void; variant?: Variant; disabled?: boolean; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle>; silent?: boolean; small?: boolean; accessibilityLabel?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, { toValue: v, friction: 6, tension: 220, useNativeDriver: ND }).start();
  const bg = variant === 'gold' ? COLORS.gold : variant === 'bull' ? COLORS.bull : variant === 'bear' ? COLORS.bear : 'transparent';
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPressIn={() => to(0.95)}
        onPressOut={() => to(1)}
        onPress={() => { if (!silent) reward.tap(); onPress(); }}
        style={[styles.base, small && styles.small, { backgroundColor: bg, opacity: disabled ? 0.4 : 1 }, variant === 'ghost' && styles.ghost]}
      >
        <Text style={[styles.text, small && { fontSize: 12 }, { color: variant === 'ghost' ? COLORS.text : COLORS.ink }, textStyle]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 46, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  small: { minHeight: 38, paddingVertical: 8, paddingHorizontal: 12 },
  ghost: { borderWidth: 1, borderColor: COLORS.line },
  text: { fontWeight: '800', fontSize: 14, letterSpacing: 0.3 },
});
