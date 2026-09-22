import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GLOSSARY, STRATEGIES } from '../core/data/book';
import { LEVELS, RECOMMENDED_START } from '../core/data/levels';
import { useBookContent } from '../core/firebase/content';
import { useI18n } from '../core/i18n';
import { routeForLevel } from '../core/nav';
import { reward } from '../core/services/feedback';
import { useGame } from '../core/store/game';
import { isUnlocked } from '../core/store/logic';
import type { BookItem, Lang } from '../core/types';
import { Btn } from '../ui/Button';
import Diagram from '../ui/Diagrams';
import { Screen, TopBar } from '../ui/Screen';
import { COLORS, RADIUS } from '../ui/theme';

function loc<T>(val: Record<Lang, T> | T | undefined, lang: Lang): T | undefined {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const o = val as Record<string, T>;
    return o[lang] ?? o.fr;
  }
  return val as T | undefined;
}

export default function BookScreen() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const game = useGame();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const strategies = useBookContent('strategies', STRATEGIES);
  const glossary = useBookContent('glossary', GLOSSARY);
  const [tab, setTab] = useState<'strategies' | 'glossary'>('strategies');
  const [item, setItem] = useState<BookItem | null>(null);

  useEffect(() => {
    if (!focus) return;
    const found = strategies.find((s) => s.id === focus);
    if (found) setItem(found);
  }, [focus, strategies]);

  const list = tab === 'strategies' ? strategies : glossary;
  const level = item ? LEVELS.find((l) => l.strategyId === item.id || l.quizId === item.id) : undefined;
  const canPlay = level ? isUnlocked(game, level.id, RECOMMENDED_START[game.choice ?? 'debutant']) : false;

  const grouped = useMemo(() => {
    const m = new Map<number, BookItem[]>();
    list.forEach((it) => { const k = it.tier ?? 0; m.set(k, [...(m.get(k) ?? []), it]); });
    return [...m.entries()];
  }, [list]);

  if (item) {
    const rawPoints = loc(item.points, lang);
    const points = Array.isArray(rawPoints) ? rawPoints : [];
    return (
      <Screen bottom={false}>
        <TopBar title={t('book_detail')} onBack={() => setItem(null)} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text style={styles.eyebrow}>{item.tier ? t(`tier_${item.tier}`) : t('book_notion')}</Text>
          <Text style={styles.itemTitle}>{String(loc(item.title, lang) ?? '')}</Text>
          <Text style={styles.itemDef}>{String(loc(item.def, lang) ?? '')}</Text>
          {item.diagram ? <View style={styles.diagramBox}><Diagram type={item.diagram} /></View> : null}
          {points.length > 0 && (
            <>
              <Text style={styles.panelTitle}>{t('book_key_points')}</Text>
              {points.map((p, i) => <Text key={i} style={styles.point}>• {String(p)}</Text>)}
            </>
          )}
          {level && canPlay && <Btn label={t('book_play')} onPress={() => router.push(routeForLevel(level) as never)} style={{ marginTop: 18 }} />}
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen bottom={false}>
      <TopBar title={t('book_title')} />
      <View style={styles.tabRow}>
        {(['strategies', 'glossary'] as const).map((k) => (
          <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} onPress={() => { reward.tap(); setTab(k); }} style={[styles.tab, tab === k && styles.tabActive]}>
            <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{t(k === 'strategies' ? 'book_tab_strategies' : 'book_tab_glossary')}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 6, paddingBottom: 40 }}>
        {grouped.map(([tier, items]) => (
          <View key={tier}>
            {tier > 0 && <Text style={styles.tierHeader}>{t(`tier_${tier}`)}</Text>}
            {items.map((it) => (
              <Pressable key={it.id} accessibilityRole="button" onPress={() => { reward.tap(); setItem(it); }} style={styles.row}>
                <Text style={styles.rowText}>{String(loc(it.title, lang) ?? it.id)}</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, marginBottom: 6 },
  tab: { flex: 1, paddingVertical: 9, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.sm, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  tabText: { color: COLORS.dim, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: COLORS.ink },
  tierHeader: { color: COLORS.gold, fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginTop: 14, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.md, padding: 14, marginBottom: 8 },
  rowText: { color: COLORS.text, fontSize: 14, fontWeight: '600', flex: 1 },
  chevron: { color: COLORS.dim, fontSize: 18 },
  eyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  itemTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 10 },
  itemDef: { color: COLORS.dim, fontSize: 14, lineHeight: 21, marginBottom: 16 },
  diagramBox: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.md, padding: 12, marginBottom: 16 },
  panelTitle: { color: COLORS.dim, fontSize: 10, letterSpacing: 1, marginBottom: 8 },
  point: { color: COLORS.text, fontSize: 14, marginBottom: 6, lineHeight: 20 },
});
