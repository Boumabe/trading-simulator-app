import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const ID = 'arena-daily';

/** Rappel local quotidien à 20 h (sans serveur). Demande la permission seulement après une 1re session. */
export async function ensureDailyReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily', { name: 'Défi du jour', importance: Notifications.AndroidImportance.DEFAULT });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;
    await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: ID,
      content: { title: 'Arena · défi du jour', body: 'Ta mini-session t\'attend. Garde ta série 🔥' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0, channelId: 'daily' },
    });
  } catch {
    /* les rappels ne doivent jamais faire planter l'app */
  }
}
