import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Svg, { Line, Circle } from "react-native-svg";
import COLORS from "../constants/palette";
import { useLang } from "../i18n";

export default function SplashScreen({ onDone }) {
  const { t } = useLang();

  useEffect(() => {
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <TouchableOpacity style={styles.root} activeOpacity={1} onPress={onDone}>
      <Svg width={110} height={110} viewBox="0 0 120 120">
        <Line x1={60} y1={8} x2={60} y2={38} stroke={COLORS.gold} strokeWidth={2} />
        <Line x1={60} y1={82} x2={60} y2={112} stroke={COLORS.gold} strokeWidth={2} />
        <Line x1={8} y1={60} x2={38} y2={60} stroke={COLORS.gold} strokeWidth={2} />
        <Line x1={82} y1={60} x2={112} y2={60} stroke={COLORS.gold} strokeWidth={2} />
        <Circle cx={60} cy={60} r={30} stroke={COLORS.blue} strokeWidth={1.4} fill="none" opacity={0.6} />
        <Circle cx={60} cy={60} r={5} fill={COLORS.gold} />
      </Svg>
      <Text style={styles.title}>SIMTRA</Text>
      <Text style={styles.tagline}>{t("splash_tagline")}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" },
  title: { color: COLORS.text, fontSize: 32, fontWeight: "800", letterSpacing: 6, marginTop: 20 },
  tagline: { color: COLORS.dim, fontSize: 12, marginTop: 10, textAlign: "center", paddingHorizontal: 40 },
});