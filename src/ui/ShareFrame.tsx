import React, { forwardRef } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';
import { useI18n } from '../core/i18n';
import { COLORS } from './theme';

/** Zone partageable en image : marque SIMTRA bien visible en haut, contenu, puis slogan en bas. */
export const ShareFrame = forwardRef<View, ViewProps>(function ShareFrame({ style, children, ...rest }, ref) {
  const { t } = useI18n();
  return (
    <View ref={ref} collapsable={false} style={[styles.frame, style]} {...rest}>
      <Text style={styles.brand}>SIMTRA</Text>
      {children}
      <Text style={styles.tag}>{t('share_tag')}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  frame: { backgroundColor: COLORS.panel, alignItems: 'center', padding: 14, borderRadius: 16 },
  brand: { color: COLORS.gold, fontSize: 22, fontWeight: '900', letterSpacing: 6, marginBottom: 12 },
  tag: { color: COLORS.dim, fontSize: 11, textAlign: 'center', marginTop: 10, letterSpacing: 0.5 },
});
