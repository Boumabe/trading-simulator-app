import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "completed_levels";

export async function getCompletedIds() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function markLevelComplete(id) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const ids = raw ? JSON.parse(raw) : [];
    if (!ids.includes(id)) {
      ids.push(id);
      await AsyncStorage.setItem(KEY, JSON.stringify(ids));
    }
  } catch {}
}