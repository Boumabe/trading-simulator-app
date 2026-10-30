import type { RefObject } from 'react';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

/** Capture une vue (graphique, stratégie, carte de résultat) en image PNG et ouvre le partage du téléphone. */
export async function shareView(ref: RefObject<unknown>, title: string): Promise<void> {
  if (!ref.current) return;
  try {
    const uri = await captureRef(ref as RefObject<never>, { format: 'png', quality: 1, result: 'tmpfile' });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: title });
  } catch {
    /* le partage ne doit jamais faire planter l'app */
  }
}
