import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LEVELS } from '../core/data/levels';
import { useI18n } from '../core/i18n';
import { useGame } from '../core/store/game';
import { ACHIEVEMENTS } from '../core/store/achievements';
import { liveStreak } from '../core/store/logic';
import { RANK_COUNT, rankOf } from '../core/store/ranks';
import { Btn } from '../ui/Button';
import { HudBar } from '../ui/HudBar';
import { Screen } from '../ui/Screen';
import { COLORS, RADIUS } from '../ui/theme';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const g = useGame();
  const rank = rankOf(g.xp);
  const passed = Object.values(g.levels).filter((l) => l.stars >= 1).length;
  const stars = Object.values(g.levels).reduce((s, l) => s + l.stars, 0);
  const discipline = g.stats.trades ? Math.round((g.stats.compliant / g.stats.trades) * 100) : 0;
  const unlocked = ACHIEVEMENTS.filter((a) => g.achievements[a.id]).length;

  return (
    <Screen bottom={false}>
      <HudBar />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <View style={styles.rankCard}>
          <Text style={styles.eyebrow}>{t('profile_rank')} {rank.index + 1}/{RANK_COUNT}</Text>
          <Text style={styles.rankName}>{t(rank.key)}</Text>
          <Text style={styles.rankSub}>{rank.next === null ? t('profile_max_rank') : t('profile_next_rank', { xp: rank.next - g.xp })}</Text>
        </View>

        <View style={styles.grid}>
          <Stat label={t('profile_levels')} value={`${passed}/${LEVELS.length}`} />
          <Stat label={t('profile_stars')} value={`★ ${stars}`} />
          <Stat label={t('play_discipline')} value={`${discipline}%`} />
          <Stat label={t('profile_trades')} value={String(g.stats.trades)} />
          <Stat label={t('profile_best_combo')} value={`🔥 ${g.stats.bestCombo}`} />
          <Stat label={t('profile_streak')} value={`${liveStreak(g, Date.now())} / ${g.streak.best}`} />
        </View>

        <Text style={styles.section}>{t('profile_achievements')} · {unlocked}/{ACHIEVEMENTS.length}</Text>
        <View style={styles.achGrid}>
          {ACHIEVEMENTS.map((a) => {
            const at = g.achievements[a.id];
            return (
              <View key={a.id} style={[styles.ach, at ? { borderColor: COLORS.gold } : { opacity: 0.55 }]} accessibilityLabel={`${t(`ach_${a.id}_t`)} — ${at ? t('profile_unlocked') : t('profile_locked')}`}>
                <Text style={[styles.achIcon, !at && { opacity: 0.35 }]}>{at ? a.icon : '🔒'}</Text>
                <Text style={styles.achTitle}>{t(`ach_${a.id}_t`)}</Text>
                <Text style={styles.achDesc}>{t(`ach_${a.id}_d`)}</Text>
                {at ? <Text style={styles.achDate}>{new Date(at).toLocaleDateString(lang)}</Text> : null}
              </View>
            );
          })}
        </View>

        <Btn variant="ghost" label={t('mysystem_title')} onPress={() => router.push('/system')} style={{ marginTop: 18 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rankCard: { backgroundColor: COLORS.panelAlt, borderWidth: 1.5, borderColor: COLORS.gold, borderRadius: RADIUS.lg, padding: 18, alignItems: 'center' },
  eyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  rankName: { color: COLORS.text, fontSize: 28, fontWeight: '900', marginTop: 4 },
  rankSub: { color: COLORS.dim, fontSize: 12, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  stat: { flexBasis: '31%', flexGrow: 1, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.md, padding: 12, alignItems: 'center' },
  statValue: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  statLabel: { color: COLORS.dim, fontSize: 10, marginTop: 3, textAlign: 'center' },
  section: { color: COLORS.dim, fontSize: 11, letterSpacing: 1.2, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ach: { flexBasis: '47%', flexGrow: 1, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.md, padding: 12 },
  achIcon: { fontSize: 26 },
  achTitle: { color: COLORS.text, fontSize: 13, fontWeight: '800', marginTop: 6 },
  achDesc: { color: COLORS.dim, fontSize: 11, marginTop: 2, lineHeight: 15 },
  achDate: { color: COLORS.gold, fontSize: 10, marginTop: 6 },
});
