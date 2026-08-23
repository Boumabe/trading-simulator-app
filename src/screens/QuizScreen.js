import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ATRDiagram, CorrelationDiagram, MultiTFDiagram, OrderFlowDiagram, SentimentDiagram } from "../components/BookDiagrams";
import COLORS from "../constants/palette";
import { QUIZ_DATA } from "../data/quizzes";
import { useLang } from "../i18n";

const VISUALS = { atr: ATRDiagram, orderflow: OrderFlowDiagram, correlation: CorrelationDiagram, sentiment: SentimentDiagram, multitf: MultiTFDiagram };

export default function QuizScreen({ quizId, onBack }) {
  const { t, lang } = useLang();
  const questions = (QUIZ_DATA[quizId] && QUIZ_DATA[quizId][lang]) || (QUIZ_DATA[quizId] && QUIZ_DATA[quizId].fr) || [];
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[qIndex];
  const Visual = current ? VISUALS[current.visual] : null;

  const handleSelect = (i) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === current.correctIndex) setCorrectCount((c) => c + 1);
  };

  const handleNext = () => {
    if (qIndex + 1 < questions.length) {
      setQIndex((q) => q + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    setQIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setFinished(false);
  };

  if (!current) {
    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t("quiz_title")}</Text>
        </View>
        <Text style={styles.prompt}>{t("quiz_soon")}</Text>
      </View>
    );
  }

  if (finished) {
    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t("quiz_result")}</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.eyebrow}>{t("quiz_score")}</Text>
          <Text style={styles.scoreText}>{correctCount} / {questions.length}</Text>
          <Text style={styles.subText}>{t("quiz_not_affect")}</Text>
          <TouchableOpacity style={styles.startBtn} onPress={restart}>
            <Text style={styles.startBtnText}>{t("quiz_replay")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
            <Text style={{ color: COLORS.text }}>{t("quiz_back_to_map")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t("quiz_title")}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Text style={styles.eyebrow}>{qIndex + 1} / {questions.length}</Text>
        <View style={styles.visualBox}>{Visual && <Visual />}</View>
        <Text style={styles.prompt}>{current.prompt}</Text>

        {current.options.map((opt, i) => {
          let borderColor = COLORS.line;
          let textColor = COLORS.text;
          if (selected !== null) {
            if (i === current.correctIndex) { borderColor = COLORS.bull; textColor = COLORS.bull; }
            else if (i === selected) { borderColor = COLORS.bear; textColor = COLORS.bear; }
          }
          return (
            <TouchableOpacity key={i} style={[styles.option, { borderColor }]} onPress={() => handleSelect(i)} disabled={selected !== null}>
              <Text style={{ color: textColor, fontSize: 13 }}>{opt}</Text>
            </TouchableOpacity>
          );
        })}

        {selected !== null && (
          <View style={styles.explainBox}>
            <Text style={styles.explainTitle}>{selected === current.correctIndex ? t("quiz_correct") : t("quiz_incorrect")}</Text>
            <Text style={styles.explainText}>{current.explanation}</Text>
          </View>
        )}

        {selected !== null && (
          <TouchableOpacity style={styles.startBtn} onPress={handleNext}>
            <Text style={styles.startBtnText}>{qIndex + 1 < questions.length ? t("quiz_next") : t("quiz_see_result")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: "row", alignItems: "center", paddingTop: 14, paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
  back: { color: COLORS.text, fontSize: 24 },
  title: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  eyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginBottom: 10 },
  visualBox: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, padding: 10, marginBottom: 16 },
  prompt: { color: COLORS.text, fontSize: 15, lineHeight: 21, marginBottom: 16 },
  option: { borderWidth: 1.5, borderRadius: 10, padding: 12, marginBottom: 10, backgroundColor: COLORS.panel },
  explainBox: { backgroundColor: COLORS.panelAlt, borderRadius: 10, padding: 14, marginTop: 4, marginBottom: 16 },
  explainTitle: { color: COLORS.gold, fontSize: 12, fontWeight: "700", marginBottom: 6 },
  explainText: { color: COLORS.dim, fontSize: 12.5, lineHeight: 18 },
  startBtn: { backgroundColor: COLORS.gold, borderRadius: 10, padding: 14, alignItems: "center", marginTop: 4 },
  startBtnText: { color: "#0A0E17", fontWeight: "700" },
  cancelBtn: { alignItems: "center", padding: 12, marginTop: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  scoreText: { color: COLORS.text, fontSize: 40, fontWeight: "800", marginBottom: 12 },
  subText: { color: COLORS.dim, fontSize: 12.5, textAlign: "center", marginBottom: 24, lineHeight: 18 },
});