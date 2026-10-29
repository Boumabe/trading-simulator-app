import React from 'react';
import { View } from 'react-native';
import { ARENA_HTML } from '@/core/arenaHtml';

/** Version web (Vercel / iPhone via « Sur l'écran d'accueil ») : le jeu tourne dans une iframe. */
export default function ArenaScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#080c12' }}>
      {React.createElement('iframe', { srcDoc: ARENA_HTML, title: 'Arena', style: { border: 0, width: '100%', height: '100%' } })}
    </View>
  );
}
