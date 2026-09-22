import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultPersisted, migrateLegacy, sanitize, type Persisted } from './logic';

export const STORAGE_KEY = 'simtra:v2';
const LEGACY = ['wallet_balance', 'wallet_last_bonus_date', 'completed_levels', 'seen_trading_tour', 'my_system_checklist'];

export async function loadPersisted(): Promise<Persisted> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return sanitize(JSON.parse(raw));
    const [balance, , completed, tour, checklist] = await AsyncStorage.multiGet(LEGACY).then((r) => r.map(([, v]) => v));
    return migrateLegacy({ balance, completed, tour, checklist }) ?? defaultPersisted();
  } catch {
    return defaultPersisted();
  }
}

export async function savePersisted(p: Persisted): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* stockage plein ou indisponible : on continue sans planter */
  }
}

export async function wipeStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, ...LEGACY]);
  } catch {
    /* ignore */
  }
}
