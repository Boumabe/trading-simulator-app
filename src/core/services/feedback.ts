import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

export type Sfx = 'click' | 'coin' | 'success' | 'fail' | 'lock';
export type HapticKind = 'select' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const SOURCES: Record<Sfx, number> = {
  click: require('../../../assets/sounds/click.wav'),
  coin: require('../../../assets/sounds/coin.wav'),
  success: require('../../../assets/sounds/success.wav'),
  fail: require('../../../assets/sounds/fail.wav'),
  lock: require('../../../assets/sounds/lock.wav'),
};

let prefs = { sound: true, haptics: true };
const players: Partial<Record<Sfx, AudioPlayer>> = {};

export function setFeedbackPrefs(p: { sound: boolean; haptics: boolean }) {
  prefs = { sound: p.sound, haptics: p.haptics };
}

/** Joue un son. Ne lève jamais d'erreur : un son raté ne doit pas casser le jeu. */
export function sfx(name: Sfx) {
  if (!prefs.sound) return;
  try {
    const p = (players[name] ??= createAudioPlayer(SOURCES[name]));
    void p.seekTo(0);
    p.play();
  } catch {
    /* audio indisponible */
  }
}

export function haptic(kind: HapticKind) {
  if (!prefs.haptics || Platform.OS === 'web') return;
  try {
    switch (kind) {
      case 'select': void Haptics.selectionAsync(); break;
      case 'light': void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
      case 'medium': void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
      case 'heavy': void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
      case 'success': void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
      case 'warning': void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
      case 'error': void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
    }
  } catch {
    /* pas de moteur haptique */
  }
}

/** Combinaisons prêtes à l'emploi pour les récompenses. */
export const reward = {
  coin: () => { sfx('coin'); haptic('light'); },
  win: () => { sfx('success'); haptic('success'); },
  lose: () => { sfx('fail'); haptic('error'); },
  lock: () => { sfx('lock'); haptic('warning'); },
  tap: () => { sfx('click'); haptic('select'); },
};
