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
