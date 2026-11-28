import React, { useEffect } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { countdownParts, dailyNumber, dailyStatus, dailyStreakAtRisk, dailyUnlocked, liveDailyStreak, marksToSquares, msUntilNextDaily, shareText, weekDots } from '../core/daily';
import { useI18n } from '../core/i18n';
import { track } from '../core/services/analytics';
import { reward } from '../core/services/feedback';
import { trackOf, useActions, useGame } from '../core/store/game';
import { dayKey } from '../core/store/logic';
import { Btn } from './Button';
import { COLORS, RADIUS } from './theme';
import { useNow } from './useNow';

/** Carte du défi du jour, en haut de la carte des niveaux : prêt, terminé (résultat + compte à rebours) ou verrouillé. */
export function DailyCard() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const game = useGame();
  const { markChallengeViewed } = useActions();
  const now = useNow(30000);
  const key = dayKey(now);
  const status = dailyStatus(game.challenge, key, dailyUnlocked(game));
  const streak = liveDailyStreak(game.challenge, key);
  const risk = dailyStreakAtRisk(game.challenge, key);
  const number = dailyNumber(key);
  const dots = weekDots(game.challenge, key);
  const today = game.challenge.today;

  useEffect(() => { if (game.ready) markChallengeViewed(key, status); }, [game.ready, key, status, markChallengeViewed]);

  if (status === 'locked') {
    return (
      <View style={[styles.card, styles.locked]}>
        <Text style={styles.eyebrow}>🔒 {t('daily_title').toUpperCase()}</Text>
        <Text style={styles.sub}>{t('daily_locked')}</Text>
      </View>
    );
  }

  const streakLabel = streak >= 2 ? t('daily_streak_n', { n: streak }) : streak === 1 ? t('daily_streak_1') : '';
  const Dots = (
    <View style={styles.week}>
      <Text style={styles.weekLabel}>{t('daily_week')}</Text>
      <View style={styles.dots}>
        {dots.map((d) => <View key={d.key} style={[styles.dot, d.done && styles.dotDone, d.today && !d.done && styles.dotToday]} />)}
      </View>
    </View>
  );

  if (status === 'done' && today) {
    const cd = countdownParts(msUntilNextDaily(now));
    return (
      <View style={[styles.card, { borderColor: COLORS.bull }]}>
        <View style={styles.row}>
          <Text style={[styles.eyebrow, { color: COLORS.bull }]}>✓ {t('daily_num', { n: number })}</Text>
          {streakLabel ? <Text style={styles.streak}>{streakLabel}</Text> : null}
        </View>
        <Text style={styles.squares}>{marksToSquares(today.marks)}</Text>
        <Text style={styles.title}>{t('daily_card_done', { d: today.discipline })}</Text>
        <Text style={styles.sub}>{t('daily_next_in', { h: cd.h, m: cd.m })}</Text>
        {Dots}
        <Btn
          variant="ghost"
          small
          label={t('daily_share_btn')}
          onPress={() => {
            track({ e: 'daily_share', track: trackOf(game.choice) });
            void Share.share({ message: shareText(lang, { number, marks: today.marks, discipline: today.discipline, streak }) });
          }}
          style={{ marginTop: 10 }}
        />
      </View>
    );
  }

  return (
    <Pressable accessibilityRole="button" onPress={() => { reward.tap(); router.push('/daily' as never); }} style={[styles.card, { borderColor: COLORS.gold, backgroundColor: COLORS.panelAlt }]}>
      <View style={styles.row}>
        <Text style={styles.eyebrow}>🎯 {t('daily_title').toUpperCase()} · {t('daily_num', { n: number })}</Text>
        {streakLabel ? <Text style={styles.streak}>{streakLabel}</Text> : null}
      </View>
      <Text style={styles.title}>{t('daily_card_cta')}</Text>
      <Text style={styles.sub}>{streak === 0 ? t('daily_card_sub_start') : t('daily_card_sub_ready')}</Text>
      {risk ? <Text style={styles.risk}>{t('daily_streak_risk')}</Text> : null}
      {Dots}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, borderColor: COLORS.line, backgroundColor: COLORS.panel, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12 },
  locked: { opacity: 0.75 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 1.6, fontWeight: '800' },
  streak: { color: COLORS.gold, fontSize: 12, fontWeight: '800' },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginTop: 8 },
  squares: { fontSize: 22, letterSpacing: 3, marginTop: 8 },
  sub: { color: COLORS.dim, fontSize: 12, lineHeight: 17, marginTop: 4 },
  risk: { color: COLORS.warn, fontSize: 12, fontWeight: '700', marginTop: 6 },
  week: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  weekLabel: { color: COLORS.dim, fontSize: 10, letterSpacing: 1 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.line },
  dotDone: { backgroundColor: COLORS.gold },
  dotToday: { borderWidth: 1.5, borderColor: COLORS.gold, backgroundColor: 'transparent' },
});
