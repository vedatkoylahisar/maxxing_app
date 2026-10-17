import { Alert, Platform } from 'react-native';

// "Emin misin?" sorusu: web'de tarayıcının kutusu, telefonda yerel uyarı.
export function confirm(title: string, message: string, confirmText: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(message));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}
