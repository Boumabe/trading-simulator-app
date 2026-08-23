import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import COLORS from "../constants/palette";
import { useLang } from "../i18n";

export default function TourOverlay({ onFinish }) {
  const { t } = useLang();
  const [step, setStep] = useState(0);

  const STEPS = [
    { title: t("tour_step1_title"), text: t("tour_step1_text") },
    { title: t("tour_step2_title"), text: t("tour_step2_text") },
    { title: t("tour_step3_title"), text: t("tour_step3_text") },
    { title: t("tour_step4_title"), text: t("tour_step4_text") },
  ];

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{step + 1} / {STEPS.length}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.text}>{current.text}</Text>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.skipBtn} onPress={onFinish}>
            <Text style={{ color: COLORS.dim, fontSize: 12 }}>{t("tour_skip")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={() => (isLast ? onFinish() : setStep((s) => s + 1))}>
            <Text style={styles.nextBtnText}>{isLast ? t("tour_start") : t("tour_next")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(10,14,23,0.92)", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 20 },
  card: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.gold, borderRadius: 16, padding: 22, width: "100%" },
  eyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  title: { color: COLORS.text, fontSize: 17, fontWeight: "700", marginBottom: 8 },
  text: { color: COLORS.dim, fontSize: 13, lineHeight: 19, marginBottom: 20 },
  btnRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  skipBtn: { padding: 8 },
  nextBtn: { backgroundColor: COLORS.gold, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  nextBtnText: { color: "#0A0E17", fontWeight: "700", fontSize: 13 },
});