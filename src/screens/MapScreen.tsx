import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LEVELS, RECOMMENDED_START, TIER_COUNT, type LevelDef } from '../core/data/levels';
import { STRATEGIES } from '../core/data/book';
import { useI18n, useLevelName } from '../core/i18n';
import { routeForLevel } from '../core/nav';
import { reward } from '../core/services/feedback';
import { useGame } from '../core/store/game';
import { dailyAvailable, isUnlocked } from '../core/store/logic';
import { Btn } from '../ui/Button';
import { DailyChest } from '../ui/DailyChest';
import { HudBar } from '../ui/HudBar';
import { Screen } from '../ui/Screen';
import { usePulse, useShake } from '../ui/anim';
import { COLORS, FILL, RADIUS } from '../ui/theme';

type Status = 'locked' | 'open' | 'done';

const Node = memo(function Node({ lvl, status, stars, rec, align, onPress, onLocked }: {
  lvl: LevelDef; status: Status; stars: number; rec: boolean; align: 'flex-start' | 'flex-end'; onPress: () => void; onLocked: () => void;
}) {
  const { t } = useI18n();
  const name = useLevelName(lvl.id);
  const pulse = usePulse(rec && status !== 'done', 1.05, 700);
  const shake = useShake();
  const locked = status === 'locked';
  const border = locked ? COLORS.line : status === 'done' ? COLORS.bull : COLORS.gold;
  return (
    <View style={{ alignItems: align, marginBottom: 14 }}>
      <Animated.View style={{ transform: [{ scale: pulse }, { translateX: shake.x }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${lvl.id}. ${name}${locked ? ' — ' + t('map_locked') : ''}`}
          onPress={() => { if (locked) { reward.lock(); shake.shake(); onLocked(); } else { reward.tap(); onPress(); } }}
          style={[styles.node, { borderColor: border, opacity: locked ? 0.7 : 1 }]}
        >
          <View style={[styles.circle, { borderColor: border }]}>
            <Text style={{ color: locked ? COLORS.dim : status === 'done' ? COLORS.bull : COLORS.gold, fontWeight: '800', fontSize: 13 }}>
              {locked ? '🔒' : status === 'done' ? '✓' : lvl.id}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: locked ? COLORS.dim : COLORS.text }]} numberOfLines={2}>{name}</Text>
            <View style={styles.meta}>
              {lvl.kind === 'quiz' && <Text style={styles.badge}>{t('map_badge_quiz')}</Text>}
              {lvl.kind === 'tool' && <Text style={styles.badge}>{t('map_badge_tool')}</Text>}
              {status === 'done' && <Text style={styles.stars}>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</Text>}
              {rec && status !== 'done' && <Text style={styles.rec}>{t('map_recommended')}</Text>}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
});

export default function MapScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const game = useGame();
  const [sheet, setSheet] = useState<LevelDef | null>(null);
  const [chest, setChest] = useState(false);
  const [hint, setHint] = useState(false);
  const chestShown = useRef(false);
  const sheetName = useLevelName(sheet?.id ?? 1);

  const recommended = RECOMMENDED_START[game.choice ?? 'debutant'];

  useEffect(() => {
    if (game.ready && game.choice && !chestShown.current && dailyAvailable(game, Date.now())) {
      chestShown.current = true;
      setChest(true);
    }
  }, [game]);

  useEffect(() => {
    if (!hint) return;
    const id = setTimeout(() => setHint(false), 2200);
    return () => clearTimeout(id);
  }, [hint]);

  const statusOf = (l: LevelDef): Status => ((game.levels[l.id]?.stars ?? 0) >= 1 ? 'done' : isUnlocked(game, l.id, recommended) ? 'open' : 'locked');
  const nextLevel = useMemo(() => LEVELS.find((l) => statusOf(l) === 'open'), [game.levels, recommended]); // eslint-disable-line react-hooks/exhaustive-deps
  const nextName = useLevelName(nextLevel?.id ?? 1);
  const bookId = sheet ? sheet.strategyId ?? sheet.quizId : undefined;
  const inBook = !!bookId && STRATEGIES.some((b) => b.id === bookId);

  const tiers = Array.from({ length: TIER_COUNT }, (_, i) => i + 1);
  let row = 0;

  return (
    <Screen bottom={false}>
      <HudBar onPress={() => router.push('/profile')} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        {nextLevel && (
          <Pressable
            accessibilityRole="button"
            onPress={() => { reward.tap(); setSheet(nextLevel); }}
            style={styles.cta}
          >
            <Text style={styles.ctaEyebrow}>{t('map_next_up')}</Text>
            <Text style={styles.ctaTitle}>{nextLevel.id}. {nextName}</Text>
            <Text style={styles.ctaGo}>{t('map_start')} ›</Text>
          </Pressable>
        )}
        <Text style={styles.sub}>{t('map_progress', { done: Object.values(game.levels).filter((l) => l.stars >= 1).length, total: LEVELS.length })}</Text>

        {tiers.map((tier) => {
          const list = LEVELS.filter((l) => l.tier === tier);
          const done = list.filter((l) => (game.levels[l.id]?.stars ?? 0) >= 1).length;
          return (
            <View key={tier}>
              <View style={styles.tierRow}>
                <Text style={styles.tierHeader}>{t(`tier_${tier}`)}</Text>
                <Text style={styles.tierCount}>{done}/{list.length}</Text>
              </View>
              <View style={styles.tierTrack}><View style={[styles.tierFill, { width: `${(done / list.length) * 100}%` }]} /></View>
              {list.map((lvl) => {
                const align = row++ % 2 === 0 ? 'flex-start' : 'flex-end';
                return (
                  <Node
                    key={lvl.id} lvl={lvl} status={statusOf(lvl)} stars={game.levels[lvl.id]?.stars ?? 0}
                    rec={lvl.id === recommended && recommended !== 1 || lvl.id === nextLevel?.id}
                    align={align} onPress={() => setSheet(lvl)} onLocked={() => setHint(true)}
                  />
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {hint && <View style={styles.toast}><Text style={styles.toastText}>{t('map_locked_hint')}</Text></View>}

      {sheet && (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>{sheet.id} · {t(`tier_${sheet.tier}`)}</Text>
            <Text style={styles.cardTitle}>{sheetName}</Text>
            {(game.levels[sheet.id]?.stars ?? 0) > 0 && <Text style={styles.stars}>{'★'.repeat(game.levels[sheet.id].stars)}{'☆'.repeat(3 - game.levels[sheet.id].stars)}</Text>}
            <Text style={styles.cardText}>{t(sheet.kind === 'quiz' ? 'map_quiz_desc' : sheet.kind === 'tool' ? 'map_tool_desc' : 'map_market_wont_wait')}</Text>
            <Btn label={t(sheet.kind === 'quiz' ? 'map_quiz_start' : sheet.kind === 'tool' ? 'map_tool_open' : 'map_start')} onPress={() => { const l = sheet; setSheet(null); router.push(routeForLevel(l) as never); }} />
            {inBook && <Btn variant="ghost" label={t('map_read_book')} onPress={() => { setSheet(null); router.push({ pathname: '/book', params: { focus: bookId } } as never); }} style={{ marginTop: 8 }} />}
            <Btn variant="ghost" label={t('map_cancel')} onPress={() => setSheet(null)} style={{ marginTop: 8 }} />
          </View>
        </View>
      )}

      {chest && <DailyChest onClose={() => setChest(false)} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cta: { backgroundColor: COLORS.panelAlt, borderWidth: 1.5, borderColor: COLORS.gold, borderRadius: RADIUS.lg, padding: 16, marginBottom: 14 },
  ctaEyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  ctaTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginTop: 4 },
  ctaGo: { color: COLORS.gold, fontSize: 13, fontWeight: '800', marginTop: 8 },
  sub: { color: COLORS.dim, fontSize: 12, marginBottom: 6 },
  tierRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18 },
  tierHeader: { color: COLORS.gold, fontSize: 11, letterSpacing: 1.5, fontWeight: '800' },
  tierCount: { color: COLORS.dim, fontSize: 11, fontWeight: '700' },
  tierTrack: { height: 3, backgroundColor: COLORS.panelAlt, borderRadius: 2, marginTop: 6, marginBottom: 12, overflow: 'hidden' },
  tierFill: { height: 3, backgroundColor: COLORS.bull },
  node: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: RADIUS.md, padding: 10, width: 258, backgroundColor: COLORS.panel },
  circle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 13, fontWeight: '700' },
  meta: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' },
  badge: { color: COLORS.blue, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  stars: { color: COLORS.gold, fontSize: 12, letterSpacing: 1 },
  rec: { color: COLORS.gold, fontSize: 10, fontWeight: '700' },
  toast: { position: 'absolute', left: 24, right: 24, bottom: 24, backgroundColor: COLORS.panelAlt, borderColor: COLORS.bear, borderWidth: 1, borderRadius: RADIUS.md, padding: 12 },
  toastText: { color: COLORS.text, fontSize: 12, textAlign: 'center' },
  overlay: { ...FILL, backgroundColor: 'rgba(10,11,22,0.92)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 20 },
  card: { width: '100%', maxWidth: 400, backgroundColor: COLORS.panel, borderRadius: RADIUS.lg, padding: 22, borderWidth: 1, borderColor: COLORS.line },
  cardEyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  cardTitle: { color: COLORS.text, fontSize: 19, fontWeight: '800', marginBottom: 6 },
  cardText: { color: COLORS.dim, fontSize: 13, marginVertical: 12, lineHeight: 19 },
});
