import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import COLORS from "../constants/palette";
import { LEVELS } from "../data/levels";
import { useLang } from "../i18n";
import { localizedLevelName } from "../i18n/levelNames";

const KEY = "my_system_checklist";

export default function MySystemScreen({ onBack }) {
    const { t, lang } = useLang();
  const [checked, setChecked] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) setChecked(new Set(JSON.parse(raw)));
      setLoaded(true);
    })();
  }, []);

  const toggle = useCallback((id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      AsyncStorage.setItem(KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  let lastTier = null;

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t("mysystem_title")}</Text>
      </View>

      <View style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
        <Text style={styles.sub}>{t("mysystem_sub")}</Text>
        <Text style={styles.count}>{checked.size} {checked.size > 1 ? t("mysystem_selected_plural") : t("mysystem_selected")}</Text>
      </View>

      {loaded && (
        <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 0 }}>
          {LEVELS.filter((l) => l.id !== 48).map((lvl) => {
            const showHeader = lvl.tier !== lastTier;
            lastTier = lvl.tier;
            const isOn = checked.has(lvl.id);
            return (
              <View key={lvl.id}>
                {showHeader && <Text style={styles.tierHeader}>{lvl.tier}</Text>}
                <TouchableOpacity style={styles.row} onPress={() => toggle(lvl.id)}>
                  <View style={[styles.checkbox, isOn && { backgroundColor: COLORS.gold, borderColor: COLORS.gold }]}>
                    {isOn && <Text style={{ color: "#0A0E17", fontSize: 11, fontWeight: "800" }}>✓</Text>}
                  </View>
                                    <Text style={[styles.rowText, isOn && { color: COLORS.text }]}>{localizedLevelName(lvl.id, lang)}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: "row", alignItems: "center", paddingTop: 14, paddingHorizontal: 16, paddingBottom: 6, gap: 10 },
  back: { color: COLORS.text, fontSize: 24 },
  title: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  sub: { color: COLORS.dim, fontSize: 12, lineHeight: 17, marginBottom: 6 },
  count: { color: COLORS.gold, fontSize: 11, fontWeight: "700" },
  tierHeader: { color: COLORS.gold, fontSize: 10, letterSpacing: 1.5, marginTop: 14, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, padding: 12, marginBottom: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: COLORS.line, alignItems: "center", justifyContent: "center" },
  rowText: { color: COLORS.dim, fontSize: 13 },
});