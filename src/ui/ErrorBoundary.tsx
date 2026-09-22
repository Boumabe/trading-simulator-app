import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from './theme';
import { Btn } from './Button';

/** Filet de sécurité : une erreur d'écran affiche un message et un bouton, pas un écran blanc. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.root}>
        <Text style={styles.emoji}>🛠️</Text>
        <Text style={styles.title}>Oups — Simtra a rencontré un problème.</Text>
        <Text style={styles.sub}>Ta progression est sauvegardée. / Your progress is saved.</Text>
        <Btn label="Recharger / Reload" onPress={() => this.setState({ error: null })} style={{ alignSelf: 'stretch', marginTop: 18 }} silent />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emoji: { fontSize: 44, marginBottom: 12 },
  title: { color: COLORS.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  sub: { color: COLORS.dim, fontSize: 13, textAlign: 'center', marginTop: 8 },
});
