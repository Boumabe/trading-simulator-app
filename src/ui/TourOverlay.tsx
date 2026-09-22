import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../core/i18n';
import { Btn } from './Button';
import { COLORS, FILL, RADIUS } from './theme';

export function TourOverlay({ onFinish }: { onFinish: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const last = step === 3;
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{step + 1} / 4</Text>
        <Text style={styles.title}>{t(`tour_step${step + 1}_title`)}</Text>
        <Text style={styles.text}>{t(`tour_step${step + 1}_text`)}</Text>
        <View style={styles.row}>
          <Btn variant="ghost" small label={t('tour_skip')} onPress={onFinish} />
          <Btn small label={last ? t('tour_start') : t('tour_next')} onPress={() => (last ? onFinish() : setStep((s) => s + 1))} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...FILL, backgroundColor: 'rgba(10,11,22,0.94)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 30 },
  card: { width: '100%', maxWidth: 400, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.gold, borderRadius: RADIUS.lg, padding: 22 },
  eyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  title: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: 8 },
  text: { color: COLORS.dim, fontSize: 13, lineHeight: 19, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
