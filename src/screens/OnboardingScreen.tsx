import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../core/i18n';
import { reward } from '../core/services/feedback';
import { useActions } from '../core/store/game';
import type { StartChoice } from '../core/data/levels';
import { Btn } from '../ui/Button';
import { Screen } from '../ui/Screen';
import { COLORS, RADIUS } from '../ui/theme';

const OPTIONS: { id: StartChoice; icon: string }[] = [
  { id: 'debutant', icon: '🌱' },
  { id: 'intermediaire', icon: '📈' },
  { id: 'avance', icon: '🎯' },
];

export default function OnboardingScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { chooseStart } = useActions();
  const [choice, setChoice] = useState<StartChoice | null>(null);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>{t('onboarding_step')}</Text>
        <Text style={styles.h1}>{t('onboarding_title')}</Text>
        <Text style={styles.sub}>{t('onboarding_sub')}</Text>
        <View style={{ marginTop: 20 }}>
          {OPTIONS.map((o) => {
            const on = choice === o.id;
            return (
              <Pressable
                key={o.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => { reward.tap(); setChoice(o.id); }}
                style={[styles.card, { borderColor: on ? COLORS.gold : COLORS.line, backgroundColor: on ? COLORS.panelAlt : COLORS.panel }]}
              >
                <Text style={styles.icon}>{o.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardLabel, { color: on ? COLORS.gold : COLORS.text }]}>{t(`level_${o.id}`)}</Text>
                  <Text style={styles.cardSub}>{t(`level_${o.id}_sub`)}</Text>
                </View>
                {on && <Text style={{ color: COLORS.gold, fontSize: 20 }}>✓</Text>}
              </Pressable>
            );
          })}
        </View>
        <Btn label={t('continue')} disabled={!choice} onPress={() => { if (choice) { chooseStart(choice); router.replace('/map'); } }} style={{ marginTop: 14 }} />
        <Text style={styles.disclaimer}>{t('disclaimer_text')}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 40 },
  eyebrow: { fontSize: 11, letterSpacing: 2, color: COLORS.gold, marginBottom: 6 },
  h1: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  sub: { color: COLORS.dim, fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: RADIUS.md, padding: 14, marginBottom: 12 },
  icon: { fontSize: 26 },
  cardLabel: { fontWeight: '800', fontSize: 16 },
  cardSub: { color: COLORS.dim, fontSize: 12, marginTop: 2 },
  disclaimer: { color: COLORS.dim, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 22 },
});
