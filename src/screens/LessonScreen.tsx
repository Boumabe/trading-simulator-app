import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ECONOMY } from '../core/constants';
import { LESSON_CARD_COUNT, LESSON_OPTIONS, LESSON_QUESTIONS } from '../core/data/lesson';
import { useI18n } from '../core/i18n';
import { reward } from '../core/services/feedback';
import { track } from '../core/services/analytics';
import { trackOf, useActions, useGame } from '../core/store/game';
import { Btn } from '../ui/Button';
import { AnatomyDiagram, BullBearDiagram, SupportDiagram } from '../ui/LessonDiagrams';
import { Screen, TopBar } from '../ui/Screen';
import { COLORS, RADIUS } from '../ui/theme';

type Stage = 'cards' | 'quiz' | 'result';

/** Leçon 0 (débutants) : 4 cartes visuelles, puis 3 questions avec correction immédiate. */
export default function LessonScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const game = useGame();
  const { finishLesson, skipLesson } = useActions();
  const tk = trackOf(game.choice);
  const [stage, setStage] = useState<Stage>('cards');
  const [card, setCard] = useState(0);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const started = React.useRef(false);
  React.useEffect(() => {
    if (!started.current) { started.current = true; track({ e: 'lesson_start', track: tk }); }
  }, [tk]);

  const params = { bonus: ECONOMY.COMPLIANT_BONUS, penalty: ECONOMY.PENALTY };
  const n = card + 1;

  const nextCard = () => {
    reward.tap();
    if (card + 1 >= LESSON_CARD_COUNT) setStage('quiz');
    else setCard(card + 1);
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    reward.tap();
    setPicked(i);
    if (i === LESSON_QUESTIONS[qi].answer) setCorrect((c) => c + 1);
  };

  const nextQuestion = () => {
    reward.tap();
    if (qi + 1 >= LESSON_QUESTIONS.length) setStage('result');
    else { setQi(qi + 1); setPicked(null); }
  };

  const skip = () => { skipLesson(); router.replace('/map'); };
  const done = () => { finishLesson({ correct }); router.replace('/map'); };

  const q = LESSON_QUESTIONS[qi];

  return (
    <Screen>
      <TopBar title={t('lesson_title')} right={stage === 'cards' ? <Pressable accessibilityRole="button" onPress={skip}><Text style={styles.skip}>{t('lesson_skip')}</Text></Pressable> : undefined} />
      <ScrollView contentContainerStyle={styles.container}>
        {stage === 'cards' && (
          <>
            <Text style={styles.eyebrow}>{t('lesson_progress', { n, total: LESSON_CARD_COUNT })}</Text>
            <View style={styles.bar}><View style={[styles.fill, { width: `${(card / LESSON_CARD_COUNT) * 100}%` }]} /></View>
            <Text style={styles.h1}>{t(`lesson_s${n}_t`)}</Text>
            <View style={styles.diagram}>
              {card === 0 && <AnatomyDiagram high={t('lesson_lbl_high')} close={t('lesson_lbl_close')} open={t('lesson_lbl_open')} low={t('lesson_lbl_low')} />}
              {card === 1 && <BullBearDiagram bull={t('lesson_bull')} bear={t('lesson_bear')} />}
              {card === 2 && <SupportDiagram label={t('lesson_lbl_support')} />}
              {card === 3 && <Text style={styles.bigIcon}>📏</Text>}
            </View>
            <Text style={styles.text}>{t(`lesson_s${n}_d`, params)}</Text>
            <Btn label={t('lesson_next')} onPress={nextCard} style={{ marginTop: 18 }} />
          </>
        )}

        {stage === 'quiz' && (
          <>
            <Text style={styles.eyebrow}>{t('lesson_quiz_title')} · {qi + 1}/{LESSON_QUESTIONS.length}</Text>
            <Text style={styles.question}>{t(`${q.id}_q`)}</Text>
            {Array.from({ length: LESSON_OPTIONS }, (_, i) => {
              const isAnswer = i === q.answer;
              const showRight = picked !== null && isAnswer;
              const showWrong = picked === i && !isAnswer;
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  onPress={() => pick(i)}
                  style={[styles.option, showRight && { borderColor: COLORS.bull }, showWrong && { borderColor: COLORS.bear }]}
                >
                  <Text style={styles.optionText}>{t(`${q.id}_a${i}`)}</Text>
                </Pressable>
              );
            })}
            {picked !== null && (
              <View style={styles.feedback}>
                <Text style={[styles.feedbackTitle, { color: picked === q.answer ? COLORS.bull : COLORS.warn }]}>{picked === q.answer ? t('lesson_right') : t('lesson_wrong')}</Text>
                <Text style={styles.text}>{t(`${q.id}_why`)}</Text>
                <Btn label={t('lesson_next')} onPress={nextQuestion} style={{ marginTop: 12 }} />
              </View>
            )}
          </>
        )}

        {stage === 'result' && (
          <>
            <Text style={styles.bigIcon}>🌱</Text>
            <Text style={[styles.h1, { textAlign: 'center' }]}>{t('lesson_result_title')}</Text>
            <Text style={[styles.text, { textAlign: 'center', marginBottom: 6 }]}>{t('lesson_result_score', { n: correct, total: LESSON_QUESTIONS.length })}</Text>
            <Text style={[styles.text, { textAlign: 'center' }]}>{t('lesson_result_text')}</Text>
            <Btn label={t('lesson_go')} onPress={done} style={{ marginTop: 20 }} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  skip: { color: COLORS.dim, fontSize: 12 },
  eyebrow: { fontSize: 11, letterSpacing: 2, color: COLORS.gold, marginBottom: 6 },
  bar: { height: 4, borderRadius: 2, backgroundColor: COLORS.line, marginBottom: 16, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: COLORS.gold },
  h1: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  diagram: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.md, padding: 10, marginBottom: 14, alignItems: 'center', justifyContent: 'center', minHeight: 160 },
  bigIcon: { fontSize: 56, textAlign: 'center', marginVertical: 14 },
  text: { color: COLORS.text, fontSize: 15, lineHeight: 22 },
  question: { color: COLORS.text, fontSize: 18, fontWeight: '800', lineHeight: 25, marginBottom: 16 },
  option: { borderWidth: 1.5, borderColor: COLORS.line, backgroundColor: COLORS.panel, borderRadius: RADIUS.md, padding: 14, marginBottom: 10 },
  optionText: { color: COLORS.text, fontSize: 15, lineHeight: 21 },
  feedback: { marginTop: 8, backgroundColor: COLORS.panelAlt, borderRadius: RADIUS.md, padding: 14 },
  feedbackTitle: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
});
