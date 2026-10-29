import React from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Screen } from '@/ui/Screen';
import { ARENA_HTML } from '@/core/arenaHtml';
import { ensureDailyReminder } from '@/core/services/reminders';

/** Arena dans l'app (Android/iOS). baseUrl fixe : la progression (localStorage) est conservée entre les lancements. */
export default function ArenaScreen() {
  const onMessage = (e: WebViewMessageEvent) => {
    if (e.nativeEvent.data === 'day') ensureDailyReminder();
  };
  return (
    <Screen bottom={false}>
      <WebView
        originWhitelist={['*']}
        source={{ html: ARENA_HTML, baseUrl: 'https://arena.simtra.local/' }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        overScrollMode="never"
        style={{ flex: 1, backgroundColor: '#080c12' }}
      />
    </Screen>
  );
}
