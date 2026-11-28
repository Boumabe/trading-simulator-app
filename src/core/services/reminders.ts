import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const ID = 'arena-daily';

export type ReminderResult = 'granted' | 'denied' | 'unavailable';

/**
 * Rappel local quotidien à 20 h (sans serveur). Demande la permission si besoin.
 * `withTest` envoie aussi une notification dans quelques secondes pour confirmer que tout fonctionne.
 */
export async function ensureDailyReminder(withTest = false): Promise<ReminderResult> {
  if (Platform.OS === 'web') return 'unavailable';
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily', { name: 'Défi du jour', importance: Notifications.AndroidImportance.DEFAULT });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return 'denied';
    await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: ID,
      content: { title: 'Arena · défi du jour', body: 'Ta mini-session t\'attend. Garde ta série 🔥' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0, channelId: 'daily' },
    });
    if (withTest) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Simtra', body: '✅ Rappel activé. Rendez-vous chaque jour à 20 h.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 4, channelId: 'daily' },
      });
    }
    return 'granted';
  } catch {
    /* les rappels ne doivent jamais faire planter l'app */
    return 'denied';
  }
}

/* ---------- Défi du jour : rappels sans serveur ---------- */

import * as Localization from 'expo-localization';
import { dictionary } from '../i18n/dictionary';
import { DAILY_REMINDER_HOUR, dailyNumber } from '../daily';
import { dayKey } from '../store/logic';
import type { Lang, LangSetting } from '../types';

const CHALLENGE_IDS = ['challenge-1', 'challenge-2', 'challenge-3'];

function pickLang(setting: LangSetting): Lang {
  if (setting !== 'auto') return setting;
  const code = Localization.getLocales()[0]?.languageCode ?? 'fr';
  return code === 'fr' || code === 'ht' ? 'fr' : code === 'es' ? 'es' : 'en';
}

const fill = (lang: Lang, key: string, p: Record<string, string | number> = {}) =>
  Object.keys(p).reduce((s, k) => s.split(`{${k}}`).join(String(p[k])), dictionary[lang][key] ?? key);

export async function cancelChallengeReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Promise.all(CHALLENGE_IDS.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  } catch {
    /* ignore */
  }
}

/**
 * Programme au plus 3 rappels (les 3 prochains jours à 19 h), à refaire à chaque ouverture de l'app :
 * un joueur qui ne revient pas reçoit au plus 3 messages, puis plus rien (pas de harcèlement).
 * Les textes jouent sur la curiosité et l'identité, jamais sur la culpabilité ; ils varient d'un jour à l'autre.
 * `ask` : demande la permission (à faire seulement après une action du joueur).
 */
export async function scheduleChallengeReminders(a: { ask: boolean; langSetting: LangSetting; streak: number; playedToday: boolean; now: number }): Promise<ReminderResult> {
  if (Platform.OS === 'web') return 'unavailable';
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('daily', { name: 'Défi du jour', importance: Notifications.AndroidImportance.DEFAULT });
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && a.ask) status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return 'denied';
    await cancelChallengeReminders();
    const lang = pickLang(a.langSetting);
    const today = new Date(a.now);
    let scheduled = 0;
    for (let d = a.playedToday ? 1 : 0; d < 6 && scheduled < 3; d++) {
      const when = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d, DAILY_REMINDER_HOUR, 0, 0, 0);
      if (when.getTime() <= a.now + 60_000) continue;
      const number = dailyNumber(dayKey(when.getTime()));
      const useStreak = scheduled === 0 && a.streak >= 2;
      const body = useStreak ? fill(lang, 'daily_notif_streak', { n: a.streak }) : fill(lang, `daily_notif_${(number % 3) + 1}`);
      await Notifications.scheduleNotificationAsync({
        identifier: CHALLENGE_IDS[scheduled],
        content: { title: fill(lang, 'daily_notif_title', { n: number }), body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: 'daily' },
      });
      scheduled += 1;
    }
    return 'granted';
  } catch {
    return 'denied';
  }
}
