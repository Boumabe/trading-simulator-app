import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useI18n } from '../core/i18n';
import { reward } from '../core/services/feedback';
import { useActions, useGame } from '../core/store/game';
import type { LangSetting } from '../core/types';
import { Btn } from '../ui/Button';
import { Screen, TopBar } from '../ui/Screen';
import { COLORS, FILL, RADIUS } from '../ui/theme';

type Confirm = null | 'capital' | 'all';

export default function SettingsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { settings } = useGame();
  const { setSettings, resetCapital, resetAll } = useActions();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const langs: LangSetting[] = ['auto', 'fr', 'en', 'es'];

  const doConfirm = async () => {
    if (confirm === 'capital') { resetCapital(); setConfirm(null); return; }
    await resetAll();
    setConfirm(null);
    router.replace('/');
  };

  return (
    <Screen bottom={false}>
      <TopBar title={t('settings_title')} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <View style={styles.card}>
          <Row label={t('settings_sound')} value={settings.sound} onChange={(v) => setSettings({ sound: v })} />
          <Row label={t('settings_haptics')} value={settings.haptics} onChange={(v) => setSettings({ haptics: v })} last />
        </View>

        <Text style={styles.section}>{t('settings_language')}</Text>
        <View style={styles.langRow}>
          {langs.map((l) => (
            <Pressable key={l} accessibilityRole="radio" accessibilityState={{ selected: settings.lang === l }} onPress={() => { reward.tap(); setSettings({ lang: l }); }} style={[styles.chip, settings.lang === l && styles.chipOn]}>
              <Text style={[styles.chipText, settings.lang === l && { color: COLORS.ink }]}>{l === 'auto' ? t('settings_lang_auto') : l.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>{t('settings_data')}</Text>
        <View style={[styles.card, { borderColor: COLORS.bear }]}>
          <Text style={styles.cardTitle}>{t('settings_reset_capital_title')}</Text>
          <Text style={styles.cardDesc}>{t('settings_reset_capital_desc')}</Text>
          <Btn variant="ghost" label={t('settings_reset_capital_button')} onPress={() => setConfirm('capital')} />
          <View style={styles.sep} />
          <Text style={[styles.cardTitle, { color: COLORS.bear }]}>{t('settings_reset_title')}</Text>
          <Text style={styles.cardDesc}>{t('settings_reset_desc')}</Text>
          <Btn variant="bear" label={t('settings_reset_button')} onPress={() => setConfirm('all')} />
        </View>

        <Text style={styles.section}>{t('disclaimer_title')}</Text>
        <Text style={styles.disclaimer}>{t('disclaimer_text')}</Text>
        <Text style={styles.version}>Simtra v{Constants.expoConfig?.version ?? '2.0.0'}</Text>
      </ScrollView>

      {confirm && (
        <View style={styles.overlay}>
          <View style={styles.confirm}>
            <Text style={styles.confirmTitle}>{t(confirm === 'all' ? 'settings_reset_confirm_title' : 'settings_reset_capital_title')}</Text>
            <Text style={styles.confirmText}>{t(confirm === 'all' ? 'settings_reset_confirm_text' : 'settings_reset_capital_confirm')}</Text>
            <Btn variant="bear" label={t(confirm === 'all' ? 'settings_reset_confirm_button' : 'settings_reset_capital_button')} onPress={doConfirm} />
            <Btn variant="ghost" label={t('settings_cancel')} onPress={() => setConfirm(null)} style={{ marginTop: 8 }} />
          </View>
        </View>
      )}
    </Screen>
  );
}

function Row({ label, value, onChange, last }: { label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  return (
    <View style={[styles.switchRow, !last && { borderBottomWidth: 1, borderBottomColor: COLORS.line }]}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: COLORS.gold, false: COLORS.line }} thumbColor={value ? COLORS.ink : COLORS.dim} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.md, padding: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  switchLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  section: { color: COLORS.dim, fontSize: 11, letterSpacing: 1.2, fontWeight: '800', marginTop: 22, marginBottom: 8 },
  langRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.panel },
  chipOn: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  chipText: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800', marginBottom: 6 },
  cardDesc: { color: COLORS.dim, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  sep: { height: 1, backgroundColor: COLORS.line, marginVertical: 16 },
  disclaimer: { color: COLORS.dim, fontSize: 12, lineHeight: 18 },
  version: { color: COLORS.dim, fontSize: 11, textAlign: 'center', marginTop: 24 },
  overlay: { ...FILL, backgroundColor: 'rgba(10,11,22,0.94)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 30 },
  confirm: { width: '100%', maxWidth: 400, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.bear, borderRadius: RADIUS.lg, padding: 22 },
  confirmTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  confirmText: { color: COLORS.dim, fontSize: 13, lineHeight: 19, marginBottom: 20 },
});
