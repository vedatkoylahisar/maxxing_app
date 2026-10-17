import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Telefonda şifreli depoda (Keychain / Keystore), web'de localStorage'da saklanır.
const KEY = 'maxxing.session';

export async function readSession(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(KEY);
}

export async function writeSession(value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (value === null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, value);
    } catch {
      // Gizli pencerede depolama kapalı olabilir; oturum sadece bu sekmede yaşar.
    }
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(KEY);
  else await SecureStore.setItemAsync(KEY, value);
}
