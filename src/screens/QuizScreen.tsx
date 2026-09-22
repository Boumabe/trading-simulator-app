import React, { useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LEVELS, levelById } from '../core/data/levels';
import { QUIZ_DATA } from '../core/data/quizzes';
import { useQuizData } from '../core/firebase/content';
import { hashString, shuffled } from '../core/engine/rng';
import { useI18n, useLevelName } from '../core/i18n';
import { routeForLevel } from '../core/nav';
import { haptic, reward } from '../core/services/feedback';
import { useActions } from '../core/store/game';
import type { LevelResult } from '../core/store/logic';
import type { QuizQuestion } from '../core/types';
import { Burst } from '../ui/Burst';
import { Btn } from '../ui/Button';
import { ATRDiagram, CorrelationDiagram, MultiTFDiagram, OrderFlowDiagram, SentimentDiagram } from '../ui/Diagrams';
import { ResultOverlay } from '../ui/ResultOverlay';
import { Screen, TopBar } from '../ui/Screen';
import { useShake } from '../ui/anim';
import { COLORS, RADIUS } from '../ui/theme';

const VISUALS: Record<string, React.ComponentType> = { atr: ATRDiagram, orderflow: OrderFlowDiagram, correlation: CorrelationDiagram, sentiment: SentimentDiagram, multitf: MultiTFDiagram };

/** Mélange les options d'une question et recalcule l'index de la bonne réponse (avant : toujours en 2ᵉ position). */
function prepare(qs: QuizQuestion[], seed: number): QuizQuestion[] {
  return qs.map((q, qi) => {
    const order = shuffled(q.options.map((_, i) => i), seed + qi * 101);
    return { ...q, options: order.map((i) => q.options[i]), correctIndex: order.indexOf(q.correctIndex) };
  });
}

export default function QuizScreen({ levelId }: { levelId: number }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { finishQuiz } = useActions();
  const data = useQuizData(QUIZ_DATA);
  const level = levelById(levelId);
  const name = useLevelName(levelId);
  const quizId = level?.quizId ?? '';
  const [attempt, setAttempt] = useState(0);
  const [q, setQ] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<LevelResult | null>(null);
  const [burst, setBurst] = useState(0);
  const shake = useShake();

  const questions = useMemo(() => {
    const src = data[quizId]?.[lang] ?? data[quizId]?.fr ?? [];
    return prepare(src, hashString(quizId) + attempt * 977);
  }, [data, quizId, lang, attempt]);

  const current = questions[q];
  const Visual = current?.visual ? VISUALS[current.visual] : undefined;

  const select = (i: number) => {
    if (picked !== null || !current) return;
    setPicked(i);
    if (i === current.correctIndex) { setCorrect((c) => c + 1); reward.win(); setBurst((b) => b + 1); } else { reward.lose(); shake.shake(); }
  };

  const next = () => {
    if (q + 1 < questions.length) { setQ(q + 1); setPicked(null); haptic('select'); return; }
    setResult(finishQuiz({ levelId, correct, total: questions.length }));
  };

  const restart = () => { setAttempt((a) => a + 1); setQ(0); setPicked(null); setCorrect(0); setResult(null); };
  const following = LEVELS.find((l) => l.id === levelId + 1);

  if (!level || !current) {
    return (
      <Screen>
        <TopBar title={t('quiz_title')} onBack={() => router.back()} />
        <Text style={styles.prompt}>{t('quiz_soon')}</Text>
      </Screen>
    );
  }

  const progress = (q + (picked !== null ? 1 : 0)) / questions.length;

  return (
    <Screen>
      <TopBar title={name} onBack={() => router.back()} />
      <View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Text style={styles.eyebrow}>{q + 1} / {questions.length}</Text>
        {Visual ? <View style={styles.visualBox}><Visual /></View> : null}
        <Text style={styles.prompt}>{current.prompt}</Text>
        <Animated.View style={{ transform: [{ translateX: shake.x }] }}>
          {current.options.map((opt, i) => {
            const isRight = picked !== null && i === current.correctIndex;
            const isWrong = picked !== null && i === picked && i !== current.correctIndex;
            const c = isRight ? COLORS.bull : isWrong ? COLORS.bear : COLORS.text;
            return (
              <Pressable key={i} accessibilityRole="button" disabled={picked !== null} onPress={() => select(i)} style={[styles.option, { borderColor: isRight ? COLORS.bull : isWrong ? COLORS.bear : COLORS.line }]}>
                <Text style={{ color: c, fontSize: 14 }}>{opt}</Text>
              </Pressable>
            );
          })}
        </Animated.View>
        {picked !== null && (
          <View style={styles.explain}>
            <Text style={styles.explainTitle}>{picked === current.correctIndex ? t('quiz_correct') : t('quiz_incorrect')}</Text>
            <Text style={styles.explainText}>{current.explanation}</Text>
          </View>
        )}
        {picked !== null && <Btn label={q + 1 < questions.length ? t('quiz_next') : t('quiz_see_result')} onPress={next} />}
      </ScrollView>
      <View pointerEvents="none" style={styles.burstBox}><Burst trigger={burst} kind="coins" count={16} /></View>

      {result && (
        <ResultOverlay
          title={name}
          passed={result.passed}
          stars={result.stars}
          xp={result.xp}
          improved={result.improved}
          stats={[{ label: t('quiz_score'), value: `${correct} / ${questions.length}`, color: COLORS.gold }]}
          note={t('quiz_not_affect')}
          onReplay={restart}
          onNext={following ? () => router.replace(routeForLevel(following) as never) : undefined}
          onMap={() => router.replace('/map')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, backgroundColor: COLORS.panelAlt, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: COLORS.gold },
  eyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginBottom: 10 },
  visualBox: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.md, padding: 10, marginBottom: 16 },
  prompt: { color: COLORS.text, fontSize: 16, lineHeight: 22, marginBottom: 16 },
  option: { borderWidth: 1.5, borderRadius: RADIUS.md, padding: 14, marginBottom: 10, backgroundColor: COLORS.panel },
  explain: { backgroundColor: COLORS.panelAlt, borderRadius: RADIUS.md, padding: 14, marginBottom: 16 },
  explainTitle: { color: COLORS.gold, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  explainText: { color: COLORS.dim, fontSize: 13, lineHeight: 19 },
  burstBox: { position: 'absolute', left: '50%', top: '45%', width: 1, height: 1 },
});
