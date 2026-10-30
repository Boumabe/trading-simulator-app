import React, { useMemo } from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Screen } from '@/ui/Screen';
import { arenaHtml } from '@/core/arenaHtml';
import { useI18n } from '@/core/i18n';
import { ensureDailyReminder } from '@/core/services/reminders';

/** Arena dans l'app (Android/iOS). baseUrl fixe : la progression (localStorage) est conservée entre les lancements. */
export default function ArenaScreen() {
  const { lang } = useI18n();
  const html = useMemo(() => arenaHtml(lang), [lang]);
  const onMessage = async (e: WebViewMessageEvent) => {
    const raw = e.nativeEvent.data;
    if (raw === 'day') {
      ensureDailyReminder();
      return;
    }
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'share' && msg.png) {
        const file = new File(Paths.cache, 'simtra-arena.png');
        file.create({ overwrite: true });
        file.write(msg.png, { encoding: 'base64' });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, { mimeType: 'image/png', dialogTitle: msg.title });
        }
      }
    } catch {
      /* le partage ne doit jamais faire planter l'app */
    }
  };
  return (
    <Screen bottom={false}>
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://arena.simtra.local/' }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        overScrollMode="never"
        style={{ flex: 1, backgroundColor: '#080c12' }}
      />
    </Screen>
  );
}
