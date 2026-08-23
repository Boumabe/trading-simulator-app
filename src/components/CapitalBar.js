import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import COLORS from "../constants/palette";
import { useLang } from "../i18n";

export default function CapitalBar({ balance, bonusAvailable, onClaimBonus, liveDelta = 0 }) {
  const { t } = useLang();
  if (balance === null) return null;
  const displayBalance = balance + liveDelta;
  const broke = displayBalance <= 0;
  const valueColor = liveDelta > 0 ? COLORS.bull : liveDelta < 0 ? COLORS.bear : COLORS.gold;

  return (
    <View style={[styles.bar, broke && styles.barBroke]}>
      <View>
        {broke ? (
          <>
            <Text style={styles.brokeText}>{t("capital_broke")}</Text>
            <Text style={styles.brokeSub}>{t("capital_broke_sub")}</Text>
          </>
        ) : (
          <>
            <Text style={styles.label}>{t("capital_label")}</Text>
            <Text style={[styles.value, { color: valueColor }]}>${displayBalance.toFixed(2)}</Text>
          </>
        )}
      </View>
      {bonusAvailable && (
        <TouchableOpacity style={styles.bonusBtn} onPress={onClaimBonus} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.bonusText}>{t("capital_bonus")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.panel, borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingTop: 46, paddingBottom: 14, paddingHorizontal: 16 },
  barBroke: { backgroundColor: "#1F1420", borderBottomColor: COLORS.bear },
  label: { color: COLORS.dim, fontSize: 10, letterSpacing: 1.5 },
  value: { fontSize: 42, fontWeight: "800", letterSpacing: 0.5 },
  brokeText: { color: COLORS.bear, fontSize: 14, fontWeight: "800" },
  brokeSub: { color: COLORS.dim, fontSize: 11, marginTop: 2 },
  bonusBtn: { backgroundColor: COLORS.gold, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  bonusText: { color: "#0A0E17", fontWeight: "700", fontSize: 11 },
});