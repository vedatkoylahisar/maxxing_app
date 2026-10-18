import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Küçük değerler (oturum, dil tercihi): telefonda şifreli depoda (Keychain / Keystore), web'de localStorage'da.
export async function readItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function writeItem(key: string, value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // Gizli pencerede depolama kapalı olabilir; değer sadece bu sekmede yaşar.
    }
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}
