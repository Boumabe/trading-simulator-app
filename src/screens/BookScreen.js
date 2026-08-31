import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import Diagram from "../components/BookDiagrams";
import COLORS from "../constants/palette";
import { useLang } from "../i18n";
import { fetchStrategies, fetchGlossary } from "../firebase/content";

function loc(val, lang) {
  if (val && typeof val === "object" && !Array.isArray(val)) return val[lang] || val.fr;
  return val;
}

export default function BookScreen({ onBack }) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState("strategies");
  const [item, setItem] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [glossary, setGlossary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, g] = await Promise.all([fetchStrategies(), fetchGlossary()]);
      setStrategies(s);
      setGlossary(g);
      setLoading(false);
    })();
  }, []);

  if (item) {
    const points = loc(item.points, lang);
    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setItem(null)} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t("book_detail")}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.eyebrow}>{item.tier ? item.tier : t("book_notion")}</Text>
          <Text style={styles.itemTitle}>{loc(item.title, lang)}</Text>
          <Text style={styles.itemDef}>{loc(item.def, lang)}</Text>
          {item.diagram && (
            <View style={styles.diagramBox}>
              <Diagram type={item.diagram} />
            </View>
          )}
          {points && (
            <>
              <Text style={styles.panelTitle}>{t("book_key_points")}</Text>
              {points.map((p, i) => (
                <Text key={i} style={styles.point}>• {p}</Text>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  const list = tab === "strategies" ? strategies : glossary;
  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t("book_title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setTab("strategies")} style={[styles.tab, tab === "strategies" && styles.tabActive]}>
          <Text style={[styles.tabText, tab === "strategies" && styles.tabTextActive]}>{t("book_tab_strategies")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab("glossaire")} style={[styles.tab, tab === "glossaire" && styles.tabActive]}>
          <Text style={[styles.tabText, tab === "glossaire" && styles.tabTextActive]}>{t("book_tab_glossary")}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={COLORS.gold} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 6 }}>
          {list.map((it) => (
            <TouchableOpacity key={it.id} style={styles.row} onPress={() => setItem(it)}>
              <Text style={styles.rowText}>{loc(it.title, lang)}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 14, paddingHorizontal: 16, paddingBottom: 10 },
  back: { color: COLORS.text, fontSize: 24 },
  title: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 18, marginBottom: 6 },
  tab: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.line, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  tabText: { color: COLORS.dim, fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: "#0A0E17" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, padding: 14, marginBottom: 8 },
  rowText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  chevron: { color: COLORS.dim, fontSize: 16 },
  eyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  itemTitle: { color: COLORS.text, fontSize: 20, fontWeight: "700", marginBottom: 10 },
  itemDef: { color: COLORS.dim, fontSize: 13, lineHeight: 20, marginBottom: 16 },
  diagramBox: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, padding: 12, marginBottom: 16 },
  panelTitle: { color: COLORS.dim, fontSize: 10, letterSpacing: 1, marginBottom: 8 },
  point: { color: COLORS.text, fontSize: 13, marginBottom: 6, lineHeight: 18 },
});