import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../core/i18n';
import { Btn } from './Button';
import { COLORS, FILL, RADIUS } from './theme';

/** Avant le défi : le nom du niveau et sa règle (le joueur sait ce qu'on attend de lui), puis un seul bouton. */
export function DailyBriefing({ number, name, rule, onStart }: { number: number; name: string; rule: string; onStart: () => void }) {
  const { t } = useI18n();
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{t('daily_title').toUpperCase()}</Text>
        <Text style={styles.title}>{t('daily_num', { n: number })} · {name}</Text>
        <Text style={styles.sub}>{t('daily_briefing_sub')}</Text>
        <View style={styles.rule}>
          <Text style={styles.ruleLabel}>{t('daily_briefing_rule')}</Text>
          <Text style={styles.ruleText}>{rule}</Text>
        </View>
        <Text style={styles.note}>{t('daily_briefing_note')}</Text>
        <Btn label={t('daily_briefing_go')} onPress={onStart} style={{ marginTop: 14 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...FILL, zIndex: 30, backgroundColor: 'rgba(6,7,16,0.88)', justifyContent: 'center', padding: 18 },
  card: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.gold, borderRadius: RADIUS.lg, padding: 20 },
  eyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  sub: { color: COLORS.dim, fontSize: 13, lineHeight: 19 },
  rule: { backgroundColor: COLORS.panelAlt, borderRadius: RADIUS.md, padding: 12, marginTop: 14 },
  ruleLabel: { color: COLORS.gold, fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginBottom: 4 },
  ruleText: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  note: { color: COLORS.dim, fontSize: 12, lineHeight: 17, marginTop: 12 },
});
