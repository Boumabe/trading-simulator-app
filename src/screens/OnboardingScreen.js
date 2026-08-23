import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import COLORS from "../constants/palette";
import { useLang } from "../i18n";

export default function OnboardingScreen({ onDone }) {
  const { t } = useLang();
  const [choice, setChoice] = useState(null);

  const OPTIONS = [
    { id: "debutant", label: t("level_debutant"), sub: t("level_debutant_sub") },
    { id: "intermediaire", label: t("level_intermediaire"), sub: t("level_intermediaire_sub") },
    { id: "avance", label: t("level_avance"), sub: t("level_avance_sub") },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{t("onboarding_step")}</Text>
      <Text style={styles.h1}>{t("onboarding_title")}</Text>
      <Text style={styles.sub}>{t("onboarding_sub")}</Text>

      <View style={{ marginTop: 20 }}>
        {OPTIONS.map((o) => (
          <TouchableOpacity
            key={o.id}
            onPress={() => setChoice(o.id)}
            style={[styles.card, { borderColor: choice === o.id ? COLORS.gold : COLORS.line }]}
          >
            <Text style={[styles.cardLabel, { color: choice === o.id ? COLORS.gold : COLORS.text }]}>{o.label}</Text>
            <Text style={styles.cardSub}>{o.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        disabled={!choice}
        onPress={() => onDone(choice)}
        style={[styles.startBtn, { opacity: choice ? 1 : 0.4 }]}
      >
        <Text style={styles.startBtnText}>{t("continue")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20, paddingTop: 60 },
  eyebrow: { fontSize: 11, letterSpacing: 2, color: COLORS.gold, marginBottom: 6 },
  h1: { fontSize: 24, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  sub: { color: COLORS.dim, fontSize: 13 },
  card: { backgroundColor: COLORS.panel, borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 12 },
  cardLabel: { fontWeight: "700", fontSize: 15 },
  cardSub: { color: COLORS.dim, fontSize: 12, marginTop: 2 },
  startBtn: { backgroundColor: COLORS.gold, borderRadius: 10, padding: 14, alignItems: "center", marginTop: 10 },
  startBtnText: { color: "#0A0E17", fontWeight: "700", fontSize: 14 },
});