import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import COLORS from "../constants/palette";
import { LEVELS, RECOMMENDED_BY_LEVEL } from "../data/levels";
import { useLang } from "../i18n";

export default function MapScreen({ level, onBack, onOpenLevel, onOpenQuiz, onOpenTool, onOpenBook }) {
  const { t } = useLang();
  const [confirmLvl, setConfirmLvl] = useState(null);
  const recommendedId = RECOMMENDED_BY_LEVEL[level] || 1;
  const statusFor = (lvl) => (lvl.strategyId || lvl.type ? "active" : "locked");

  let lastTier = null;

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t("map_title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
        <Text style={styles.sub}>{LEVELS.length} {t("map_sub")}</Text>

        {LEVELS.map((lvl, i) => {
          const status = statusFor(lvl);
          const isRec = lvl.id === recommendedId && recommendedId !== 1;
          const showHeader = lvl.tier !== lastTier;
          lastTier = lvl.tier;
          const align = i % 2 === 0 ? "flex-start" : "flex-end";
          return (
            <View key={lvl.id}>
              {showHeader && <Text style={styles.tierHeader}>{lvl.tier}</Text>}
              <View style={{ alignItems: align, marginBottom: 14 }}>
                <TouchableOpacity
                  disabled={status === "locked"}
                  onPress={() => setConfirmLvl(lvl)}
                  style={[styles.node, { borderColor: status === "active" ? COLORS.gold : COLORS.line }]}
                >
                  <View style={[styles.circle, { borderColor: status === "active" ? COLORS.gold : COLORS.line }]}>
                    <Text style={{ color: status === "active" ? COLORS.gold : COLORS.dim, fontWeight: "700", fontSize: 12 }}>
                      {status === "locked" ? "○" : lvl.id}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: status === "locked" ? COLORS.dim : COLORS.text }]}>{lvl.name}</Text>
                    {lvl.type === "quiz" && <Text style={styles.badge}>{t("map_badge_quiz")}</Text>}
                    {lvl.type === "tool" && <Text style={styles.badge}>{t("map_badge_tool")}</Text>}
                    {isRec && <Text style={styles.rec}>{t("map_recommended")}</Text>}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.bookFab} onPress={onOpenBook}>
        <Text style={{ fontSize: 20 }}>📖</Text>
      </TouchableOpacity>

      {confirmLvl && (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>{confirmLvl.id}</Text>
            <Text style={styles.cardTitle}>{confirmLvl.name}</Text>
            {confirmLvl.type === "quiz" ? (
              <>
                <Text style={styles.cardText}>{t("map_quiz_desc")}</Text>
                <TouchableOpacity style={styles.startBtn} onPress={() => onOpenQuiz(confirmLvl.quizId)}>
                  <Text style={styles.startBtnText}>{t("map_quiz_start")}</Text>
                </TouchableOpacity>
              </>
            ) : confirmLvl.type === "tool" ? (
              <>
                <Text style={styles.cardText}>{t("map_tool_desc")}</Text>
                <TouchableOpacity style={styles.startBtn} onPress={onOpenTool}>
                  <Text style={styles.startBtnText}>{t("map_tool_open")}</Text>
                </TouchableOpacity>
              </>
            ) : confirmLvl.strategyId ? (
              <>
                <Text style={styles.cardText}>{t("map_market_wont_wait")}</Text>
                <TouchableOpacity style={styles.startBtn} onPress={() => onOpenLevel(confirmLvl.strategyId)}>
                  <Text style={styles.startBtnText}>{t("map_start")}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.cardText}>{t("map_soon")}</Text>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmLvl(null)}>
              <Text style={{ color: COLORS.text }}>{confirmLvl.strategyId || confirmLvl.type ? t("map_cancel") : t("map_close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 14, paddingHorizontal: 16, paddingBottom: 10 },
  back: { color: COLORS.text, fontSize: 24 },
  title: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  sub: { color: COLORS.dim, fontSize: 12, marginBottom: 16 },
  tierHeader: { color: COLORS.gold, fontSize: 10, letterSpacing: 1.5, marginTop: 14, marginBottom: 10 },
  node: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderRadius: 10, padding: 10, maxWidth: 250, backgroundColor: COLORS.panel },
  circle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 12.5, fontWeight: "600" },
  badge: { color: COLORS.blue, fontSize: 9, fontWeight: "700", marginTop: 3, letterSpacing: 0.5 },
  rec: { color: COLORS.gold, fontSize: 9, marginTop: 3 },
  bookFab: { position: "absolute", bottom: 24, right: 24, width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.gold, alignItems: "center", justifyContent: "center" },
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(10,14,23,0.9)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { backgroundColor: COLORS.panel, borderRadius: 14, padding: 22, width: "100%", borderWidth: 1, borderColor: COLORS.line },
  cardEyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  cardTitle: { color: COLORS.text, fontSize: 18, fontWeight: "700", marginBottom: 8 },
  cardText: { color: COLORS.dim, fontSize: 12, marginBottom: 16, lineHeight: 18 },
  startBtn: { backgroundColor: COLORS.gold, borderRadius: 8, padding: 12, alignItems: "center", marginBottom: 8 },
  startBtnText: { color: "#0A0E17", fontWeight: "700" },
  cancelBtn: { alignItems: "center", padding: 10 },
});