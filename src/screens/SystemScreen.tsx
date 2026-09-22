import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LEVELS, type LevelDef } from '../core/data/levels';
import { useI18n, useLevelName } from '../core/i18n';
import { reward } from '../core/services/feedback';
import { useActions, useGame } from '../core/store/game';
import { Screen, TopBar } from '../ui/Screen';
import { COLORS, RADIUS } from '../ui/theme';

function Row({ lvl, on, onToggle }: { lvl: LevelDef; on: boolean; onToggle: () => void }) {
  const name = useLevelName(lvl.id);
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={styles.row} onPress={() => { reward.tap(); onToggle(); }}>
      <View style={[styles.checkbox, on && { backgroundColor: COLORS.gold, borderColor: COLORS.gold }]}>{on && <Text style={styles.tick}>✓</Text>}</View>
      <Text style={[styles.rowText, on && { color: COLORS.text }]}>{name}</Text>
    </Pressable>
  );
}

export default function SystemScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { checklist } = useGame();
  const { toggleChecklist } = useActions();
  const items = LEVELS.filter((l) => l.kind !== 'tool');
  let lastTier = 0;

  return (
    <Screen>
      <TopBar title={t('mysystem_title')} onBack={() => router.back()} />
      <View style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
        <Text style={styles.sub}>{t('mysystem_sub')}</Text>
        <Text style={styles.count}>{checklist.length} {checklist.length > 1 ? t('mysystem_selected_plural') : t('mysystem_selected')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 0, paddingBottom: 40 }}>
        {items.map((lvl) => {
          const header = lvl.tier !== lastTier;
          lastTier = lvl.tier;
          return (
            <View key={lvl.id}>
              {header && <Text style={styles.tier}>{t(`tier_${lvl.tier}`)}</Text>}
              <Row lvl={lvl} on={checklist.includes(lvl.id)} onToggle={() => toggleChecklist(lvl.id)} />
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { color: COLORS.dim, fontSize: 12, lineHeight: 17, marginBottom: 6 },
  count: { color: COLORS.gold, fontSize: 12, fontWeight: '800' },
  tier: { color: COLORS.gold, fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginTop: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.md, padding: 12, marginBottom: 6 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  tick: { color: COLORS.ink, fontSize: 12, fontWeight: '900' },
  rowText: { color: COLORS.dim, fontSize: 14, flex: 1 },
});
