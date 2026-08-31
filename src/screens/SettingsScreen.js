import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import COLORS from "../constants/palette";
import { useLang } from "../i18n";

export default function SettingsScreen({ onBack, onConfirmReset }) {
  const { t } = useLang();
  const [confirming, setConfirming] = useState(false);

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t("settings_title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ padding: 18 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("settings_reset_title")}</Text>
          <Text style={styles.cardDesc}>{t("settings_reset_desc")}</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={() => setConfirming(true)}>
            <Text style={styles.resetBtnText}>{t("settings_reset_button")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {confirming && (
        <View style={styles.overlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{t("settings_reset_confirm_title")}</Text>
            <Text style={styles.confirmText}>{t("settings_reset_confirm_text")}</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={onConfirmReset}>
              <Text style={styles.resetBtnText}>{t("settings_reset_confirm_button")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirming(false)}>
              <Text style={{ color: COLORS.text }}>{t("settings_cancel")}</Text>
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
  card: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.bear, borderRadius: 12, padding: 18 },
  cardTitle: { color: COLORS.bear, fontSize: 14, fontWeight: "700", marginBottom: 8 },
  cardDesc: { color: COLORS.dim, fontSize: 12, lineHeight: 18, marginBottom: 16 },
  resetBtn: { backgroundColor: COLORS.bear, borderRadius: 8, padding: 12, alignItems: "center" },
  resetBtnText: { color: "#0A0E17", fontWeight: "700" },
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(10,14,23,0.92)", alignItems: "center", justifyContent: "center", padding: 24 },
  confirmCard: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.bear, borderRadius: 16, padding: 22, width: "100%" },
  confirmTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700", marginBottom: 8 },
  confirmText: { color: COLORS.dim, fontSize: 13, lineHeight: 19, marginBottom: 20 },
  cancelBtn: { alignItems: "center", padding: 10, marginTop: 8 },
});