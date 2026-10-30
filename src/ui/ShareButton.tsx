import React, { type RefObject } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { shareView } from '../core/services/share';
import { useI18n } from '../core/i18n';
import { Btn } from './Button';

/** Bouton « 📸 Partager » : capture la zone `targetRef` et ouvre le partage. */
export function ShareButton({ targetRef, title, label, style }: { targetRef: RefObject<unknown>; title: string; label?: string; style?: StyleProp<ViewStyle> }) {
  const { t } = useI18n();
  return <Btn variant="ghost" label={label ?? t('share_btn')} onPress={() => { void shareView(targetRef, title); }} style={style} />;
}
