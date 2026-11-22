import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../core/i18n';
import { reward } from '../core/services/feedback';
import { track } from '../core/services/analytics';
import { trackOf, useActions, useGame } from '../core/store/game';
import { canRedoPlacement } from '../core/store/logic';
import { RECOMMENDED_START, type StartChoice } from '../core/data/levels';
import { OPTION_COUNT, PLACEMENT_QUESTIONS, PLACEMENT_TOTAL, placementFor, shuffledOrder } from '../core/data/placement';
import { Btn } from '../ui/Button';
import { Screen } from '../ui/Screen';
import { COLORS, RADIUS } from '../ui/theme';

type Answer = 'right' | 'wrong' | 'skip';
type Stage = 'intro' | 'test' | 'result';

const ICON: Record<StartChoice, string> = { debutant: '🌱', intermediaire: '📈', avance: '🎯' };

/**
 * Accueil : « Je débute totalement » (sans test) ou test de niveau de 7 questions.
 * Remplace l'auto-déclaration « Quel est ton niveau ? » (un régulateur juge ces questionnaires déclaratifs peu fiables).
 */
export default function OnboardingScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const game = useGame();
  const { chooseBeginner, choosePlacement } = useActions();
  const [stage, setStage] = useState<Stage>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const seed = useRef(Date.now() % 1000003).current;
  const track0 = trackOf(game.choice);
  const canTest = canRedoPlacement(game);

  const q = PLACEMENT_QUESTIONS[index];
  const order = useMemo(() => shuffledOrder(seed + index * 97), [seed, index]);

  const correctIds = answers.map((a, i) => (a === 'right' ? PLACEMENT_QUESTIONS[i].id : null)).filter((x): x is (typeof PLACEMENT_QUESTIONS)[number]['id'] => x !== null);
  const placed: StartChoice = placementFor(correctIds);

  const startTest = () => {
    reward.tap();
    track({ e: 'diag_start', track: track0 });
    setStage('test');
  };

  const answer = (a: Answer) => {
    reward.tap();
    track({ e: 'diag_answer', qid: q.id, result: a });
    const next = [...answers, a];
    setAnswers(next);
    if (index + 1 >= PLACEMENT_TOTAL) setStage('result');
    else setIndex(index + 1);
  };

  const beginner = () => { chooseBeginner(); router.replace('/map'); };
  const confirmPlacement = () => {
    choosePlacement({ choice: placed, correct: correctIds.length, total: PLACEMENT_TOTAL });
    router.replace('/map');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        {stage === 'intro' && (
          <>
            <Text style={styles.h1}>{t('ob_welcome')}</Text>
            <Text style={styles.sub}>{t('ob_intro')}</Text>
            <View style={{ marginTop: 20 }}>
              <Pressable accessibilityRole="button" onPress={() => { reward.tap(); beginner(); }} style={[styles.card, { borderColor: COLORS.gold, backgroundColor: COLORS.panelAlt }]}>
                <Text style={styles.icon}>🌱</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardLabel, { color: COLORS.gold }]}>{t('ob_new_title')}</Text>
                  <Text style={styles.cardSub}>{t('ob_new_sub')}</Text>
                </View>
              </Pressable>
              {canTest && (
                <Pressable accessibilityRole="button" onPress={startTest} style={[styles.card, { borderColor: COLORS.line, backgroundColor: COLORS.panel }]}>
                  <Text style={styles.icon}>🎯</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardLabel}>{t('ob_test_title')}</Text>
                    <Text style={styles.cardSub}>{t('ob_test_sub')}</Text>
                  </View>
                </Pressable>
              )}
            </View>
            <Text style={styles.note}>{t('ob_stats_note')}</Text>
            <Text style={styles.disclaimer}>{t('disclaimer_text')}</Text>
          </>
        )}

        {stage === 'test' && (
          <>
            <Text style={styles.eyebrow}>{t('pt_progress', { n: index + 1, total: PLACEMENT_TOTAL })}</Text>
            <View style={styles.track}><View style={[styles.fill, { width: `${(index / PLACEMENT_TOTAL) * 100}%` }]} /></View>
            {index === 0 && <Text style={[styles.sub, { marginBottom: 10 }]}>{t('pt_hint')}</Text>}
            <Text style={styles.question}>{t(`pq_${q.id}_q`)}</Text>
            {order.slice(0, OPTION_COUNT).map((idx) => (
              <Pressable
                key={idx}
                accessibilityRole="button"
                onPress={() => answer(idx === 0 ? 'right' : 'wrong')}
                style={[styles.option]}
              >
                <Text style={styles.optionText}>{t(`pq_${q.id}_a${idx}`)}</Text>
              </Pressable>
            ))}
            <Btn variant="ghost" label={t('pt_dont_know')} onPress={() => answer('skip')} style={{ marginTop: 4 }} />
          </>
        )}

        {stage === 'result' && (
          <>
            <Text style={styles.eyebrow}>{t('pt_result_title')}</Text>
            <Text style={styles.bigIcon}>{ICON[placed]}</Text>
            <Text style={styles.h1}>{t(`level_${placed}`)}</Text>
            <Text style={[styles.sub, { marginBottom: 6 }]}>{t('pt_result_score', { n: correctIds.length, total: PLACEMENT_TOTAL })}</Text>
            <Text style={styles.resultText}>{t(`pt_result_${placed}`, { start: RECOMMENDED_START[placed] })}</Text>
            <Btn label={t('pt_start')} onPress={confirmPlacement} style={{ marginTop: 18 }} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 40 },
  eyebrow: { fontSize: 11, letterSpacing: 2, color: COLORS.gold, marginBottom: 6 },
  h1: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  sub: { color: COLORS.dim, fontSize: 14, lineHeight: 20 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: RADIUS.md, padding: 14, marginBottom: 12 },
  icon: { fontSize: 26 },
  bigIcon: { fontSize: 56, textAlign: 'center', marginVertical: 14 },
  cardLabel: { fontWeight: '800', fontSize: 16, color: COLORS.text },
  cardSub: { color: COLORS.dim, fontSize: 12, marginTop: 2 },
  note: { color: COLORS.dim, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 20 },
  disclaimer: { color: COLORS.dim, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 14 },
  track: { height: 4, borderRadius: 2, backgroundColor: COLORS.line, marginBottom: 14, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: COLORS.gold },
  question: { color: COLORS.text, fontSize: 18, fontWeight: '800', lineHeight: 25, marginBottom: 16 },
  option: { borderWidth: 1.5, borderColor: COLORS.line, backgroundColor: COLORS.panel, borderRadius: RADIUS.md, padding: 14, marginBottom: 10 },
  optionText: { color: COLORS.text, fontSize: 15, lineHeight: 21 },
  resultText: { color: COLORS.text, fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
