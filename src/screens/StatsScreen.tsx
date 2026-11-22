import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { fetchStats, type Counts } from '../core/services/analytics';
import { buildReport, reportToText, type Section } from '../core/services/statsReport';
import { Btn } from '../ui/Button';
import { Screen, TopBar } from '../ui/Screen';
import { COLORS, RADIUS } from '../ui/theme';

/** Tableau de bord du créateur : lit les compteurs agrégés (stats/global). Aucune donnée personnelle. Écran en français uniquement. */
export default function StatsScreen() {
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [sections, setSections] = useState<Section[]>([]);

  const load = useCallback(async () => {
    setState('loading');
    const data: Counts | null = await fetchStats();
    if (data === null) { setState('error'); return; }
    setSections(buildReport(data));
    setState('ready');
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <Screen bottom={false}>
      <TopBar title="Statistiques (bêta)" />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        {state === 'loading' && <ActivityIndicator color={COLORS.gold} style={{ marginTop: 30 }} />}
        {state === 'error' && (
          <View style={styles.card}>
            <Text style={styles.text}>Impossible de lire les statistiques (réseau ou règles Firestore). Vérifie que la règle « stats » est publiée.</Text>
            <Btn label="Réessayer" onPress={load} style={{ marginTop: 10 }} />
          </View>
        )}
        {state === 'ready' && (
          <>
            {sections.map((sec) => (
              <View key={sec.title} style={styles.card}>
                <Text style={styles.title}>{sec.title}</Text>
                {sec.lines.map((l, i) => <Text key={i} style={styles.text}>{l}</Text>)}
              </View>
            ))}
            <Btn label="Partager le rapport" onPress={() => { void Share.share({ message: reportToText(sections) }); }} />
            <Btn variant="ghost" label="Actualiser" onPress={load} style={{ marginTop: 8 }} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.md, padding: 14, marginBottom: 12 },
  title: { color: COLORS.gold, fontSize: 13, fontWeight: '800', marginBottom: 8 },
  text: { color: COLORS.text, fontSize: 12, lineHeight: 18, marginBottom: 4 },
});
