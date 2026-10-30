import type { RefObject } from 'react';
import { toBlob } from 'html-to-image';

/** Version web / PWA : capture le bloc en PNG puis ouvre le partage du navigateur (ou télécharge l'image). */
export async function shareView(ref: RefObject<unknown>, title: string): Promise<void> {
  const node = ref.current as HTMLElement | null;
  if (!node) return;
  try {
    const blob = await toBlob(node, { pixelRatio: 2, backgroundColor: '#0A0B16', cacheBust: true });
    if (!blob) return;
    const file = new File([blob], 'simtra.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title, text: title });
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'simtra.png';
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    /* partage annulé ou impossible */
  }
}
