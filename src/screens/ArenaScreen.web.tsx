import React, { useMemo } from 'react';
import { View } from 'react-native';
import { arenaHtml } from '@/core/arenaHtml';
import { useI18n } from '@/core/i18n';

/** Version web (Vercel / iPhone via « Sur l'écran d'accueil ») : le jeu tourne dans une iframe. */
export default function ArenaScreen() {
  const { lang } = useI18n();
  const html = useMemo(() => arenaHtml(lang), [lang]);
  return (
    <View style={{ flex: 1, backgroundColor: '#080c12' }}>
      {React.createElement('iframe', { srcDoc: html, title: 'Arena', style: { border: 0, width: '100%', height: '100%' } })}
    </View>
  );
}
