import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../core/i18n';
import { COLORS } from './theme';

/** Écran avec marges système (encoche, barre de gestes) : corrige le problème des boutons masqués. */
export function Screen({ children, style, bottom = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; bottom?: boolean }) {
  const insets = useSafeAreaInsets();
  return <View style={[{ flex: 1, backgroundColor: COLORS.bg, paddingTop: insets.top, paddingBottom: bottom ? insets.bottom : 0 }, style]}>{children}</View>;
}

export function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <View style={styles.bar}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel={t('back')} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }} style={styles.side}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.side} />
      )}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  side: { width: 64, justifyContent: 'center' },
  back: { color: COLORS.text, fontSize: 30, lineHeight: 32 },
  title: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '700', textAlign: 'center' },
});
