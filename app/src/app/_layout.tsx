import { Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Unbounded_600SemiBold, Unbounded_800ExtraBold } from '@expo-google-fonts/unbounded';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { SessionProvider, useSession } from '@/auth/session';
import { loadSavedLanguage } from '@/i18n';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.style.backgroundColor = colors.bg;
  document.body.style.backgroundColor = colors.bg;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Unbounded_600SemiBold,
    Unbounded_800ExtraBold,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  return (
    <SessionProvider>
      <StatusBar style="light" />
      <RootNavigator fontsLoaded={fontsLoaded} />
    </SessionProvider>
  );
}

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isLoading, session } = useSession();
  // Elle seçilmiş bir dil varsa ekran o dilde açılsın, önce cihaz dilinde görünüp değişmesin.
  const [languageLoaded, setLanguageLoaded] = useState(false);
  useEffect(() => {
    loadSavedLanguage().finally(() => setLanguageLoaded(true));
  }, []);
  const ready = fontsLoaded && !isLoading && languageLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return null;

  const verified = !!session?.user.emailVerified;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
      {/* E-posta onaylanana kadar sadece kod ekranı açılır. */}
      <Stack.Protected guard={!!session && !verified}>
        <Stack.Screen name="verify-email" />
      </Stack.Protected>
      <Stack.Protected guard={verified}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
