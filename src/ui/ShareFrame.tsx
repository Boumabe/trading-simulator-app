import React, { forwardRef } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';
import { COLORS } from './theme';

/** Zone qui peut être partagée en image : fond plein + petite signature Simtra. */
export const ShareFrame = forwardRef<View, ViewProps>(function ShareFrame({ style, children, ...rest }, ref) {
  return (
    <View ref={ref} collapsable={false} style={[styles.frame, style]} {...rest}>
      {children}
      <Text style={styles.mark}>SIMTRA</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  frame: { backgroundColor: COLORS.bg },
  mark: { alignSelf: 'flex-end', color: COLORS.dim, fontSize: 9, letterSpacing: 2, fontWeight: '800', opacity: 0.7, marginTop: 4 },
});
