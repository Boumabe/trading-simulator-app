import { useSyncExternalStore, useCallback } from 'react';
import * as Localization from 'expo-localization';
import type { Lang, LangSetting } from '../types';
import { useGame } from '../store/game';
import { fetchCollection } from '../firebase/content';
import { BASE } from './base';
import { EXTRA } from './extra';
import { NAMES } from './levelNames';
import { DIAGRAM_TEXT } from './diagrams';

const DICT: Record<Lang, Record<string, string>> = {
  fr: { ...BASE.fr, ...DIAGRAM_TEXT.fr, ...EXTRA.fr },
  en: { ...BASE.en, ...DIAGRAM_TEXT.en, ...EXTRA.en },
  es: { ...BASE.es, ...DIAGRAM_TEXT.es, ...EXTRA.es },
};

export const dictionary = DICT;

/** Langue système → langue de l'app. Le créole haïtien (ht) bascule sur le français, pas sur l'anglais. */
export function deviceLang(): Lang {
  const code = Localization.getLocales()[0]?.languageCode ?? 'fr';
  if (code === 'fr' || code === 'ht') return 'fr';
  if (code === 'es') return 'es';
  return 'en';
}

export const resolveLang = (setting: LangSetting): Lang => (setting === 'auto' ? deviceLang() : setting);

export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let out = DICT[lang][key] ?? DICT.fr[key] ?? key;
  if (params) for (const k of Object.keys(params)) out = out.split(`{${k}}`).join(String(params[k]));
  return out;
}

export function useI18n() {
  const { settings } = useGame();
  const lang = resolveLang(settings.lang);
  const t = useCallback((key: string, params?: Record<string, string | number>) => translate(lang, key, params), [lang]);
  return { lang, t };
}

/* ---------- Noms de niveaux : locaux, surchargés par Firestore s'il existe une version distante ---------- */

let remoteNames: Record<string, Partial<Record<Lang, string>>> | null = null;
let started = false;
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const snapshot = () => remoteNames;

export function loadRemoteLevelNames() {
  if (started) return;
  started = true;
  fetchCollection('levelNames').then((docs) => {
    if (!docs) return;
    const merged: Record<string, Partial<Record<Lang, string>>> = {};
    docs.forEach((d) => {
      const { id, ...rest } = d;
      merged[id] = rest as Partial<Record<Lang, string>>;
    });
    remoteNames = merged;
    listeners.forEach((l) => l());
  });
}

export function levelName(id: number, lang: Lang): string {
  const src = remoteNames?.[String(id)] ?? NAMES[id];
  return (src && (src[lang] || src.fr)) || '';
}

/** Se met à jour tout seul quand les noms distants arrivent (avant : seulement au hasard d'un re-rendu). */
export function useLevelName(id: number): string {
  const { lang } = useI18n();
  useSyncExternalStore(subscribe, snapshot, snapshot);
  return levelName(id, lang);
}
