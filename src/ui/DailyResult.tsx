import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { marksToSquares, shareText } from '../core/daily';
import { useI18n } from '../core/i18n';
import { track } from '../core/services/analytics';
import { reward } from '../core/services/feedback';
import { trackOf, useActions, useGame } from '../core/store/game';
import { Btn } from './Button';
import { ND } from './anim';
import { COLORS, FILL, RADIUS } from './theme';

export interface DailyOutcome { number: number; discipline: number; marks: string; trades: number; streak: number; best: number; milestone: number | null }

/** Fin du défi : résultat sans spoiler à partager, série, et (une seule fois, à ce moment de réussite) la proposition de rappel. */
export function DailyResult({ outcome, onBack }: { outcome: DailyOutcome; onBack: () => void }) {
  const { t, lang } = useI18n();
  const game = useGame();
  const { setChallengeReminder } = useActions();
  const pop = useRef(new Animated.Value(0)).current;
  const [remind, setRemind] = useState<'idle' | 'on' | 'denied'>(game.challenge.remind ? 'on' : 'idle');
  useEffect(() => {
    reward.win();
    Animated.timing(pop, { toValue: 1, duration: 420, easing: Easing.out(Easing.back(1.4)), useNativeDriver: ND }).start();
  }, [pop]);

  const share = () => {
    track({ e: 'daily_share', track: trackOf(game.choice) });
    void Share.share({ message: shareText(lang, { number: outcome.number, marks: outcome.marks, discipline: outcome.discipline, streak: outcome.streak }) });
  };
  const enableReminder = async () => {
    const res = await setChallengeReminder(true);
    setRemind(res === 'granted' ? 'on' : 'denied');
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={[styles.card, { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
          <Text style={styles.eyebrow}>{t('daily_result_title', { n: outcome.number })}</Text>
          <Text style={styles.squares}>{marksToSquares(outcome.marks)}</Text>
          <Text style={styles.big}>{outcome.discipline} %</Text>
          <Text style={styles.label}>{t('daily_result_disc')} · {outcome.trades} {t('daily_result_trades').toLowerCase()}</Text>
          <Text style={styles.streak}>{outcome.streak >= 2 ? t('daily_streak_n', { n: outcome.streak }) : t('daily_streak_1')}</Text>
          {outcome.milestone ? <Text style={styles.milestone}>{t('daily_milestone', { n: outcome.milestone })}</Text> : null}
          {outcome.best > outcome.streak ? <Text style={styles.label}>{t('daily_best', { n: outcome.best })}</Text> : null}
          <Btn label={t('daily_share_btn')} onPress={share} style={{ marginTop: 16 }} />
        </Animated.View>

        {remind !== 'on' && (
          <View style={styles.remind}>
            <Text style={styles.remindTitle}>{t('daily_remind_title')}</Text>
            <Btn variant="ghost" label={t('daily_remind_btn')} onPress={enableReminder} />
            {remind === 'denied' && <Text style={styles.denied}>{t('daily_remind_denied')}</Text>}
          </View>
        )}
        {remind === 'on' && <Text style={styles.on}>{t('daily_remind_on')}</Text>}
        <Btn variant="ghost" label={t('daily_back')} onPress={onBack} style={{ marginTop: 14 }} />
      </ScrollView>
    </View>
  );
}

/** Aucun trade pris : le défi n'est pas validé, on peut recommencer. */
export function DailyNoTrade({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  const { t } = useI18n();
  return (
    <View style={styles.root}>
      <View style={[styles.card, { margin: 18 }]}>
        <Text style={styles.text}>{t('daily_no_trade')}</Text>
        <Btn label={t('daily_retry')} onPress={onRetry} style={{ marginTop: 14 }} />
        <Btn variant="ghost" label={t('daily_back')} onPress={onBack} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...FILL, zIndex: 40, backgroundColor: 'rgba(6,7,16,0.92)', justifyContent: 'center' },
  scroll: { padding: 18, justifyContent: 'center', flexGrow: 1 },
  card: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.gold, borderRadius: RADIUS.lg, padding: 22, alignItems: 'center' },
  eyebrow: { color: COLORS.gold, fontSize: 11, letterSpacing: 2, fontWeight: '800' },
  squares: { fontSize: 30, letterSpacing: 4, marginTop: 14 },
  big: { color: COLORS.text, fontSize: 52, fontWeight: '800', marginTop: 6 },
  label: { color: COLORS.dim, fontSize: 12, marginTop: 2, textAlign: 'center' },
  streak: { color: COLORS.gold, fontSize: 16, fontWeight: '800', marginTop: 14 },
  milestone: { color: COLORS.bull, fontSize: 14, fontWeight: '800', marginTop: 4 },
  text: { color: COLORS.text, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  remind: { marginTop: 16, backgroundColor: COLORS.panelAlt, borderRadius: RADIUS.md, padding: 14 },
  remindTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  denied: { color: COLORS.dim, fontSize: 11, marginTop: 8, textAlign: 'center' },
  on: { color: COLORS.bull, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 14 },
});
