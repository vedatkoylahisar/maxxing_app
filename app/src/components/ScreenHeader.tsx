import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';
import type { PressState } from './pressableState';

// Alt sayfaların başlığı: geri butonu + başlık.
export function ScreenHeader({ title }: { title: string }) {
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Geri"
        hitSlop={8}
        style={(state) => [styles.back, ((state as PressState).hovered || state.pressed) && styles.backActive]}
      >
        <Text style={styles.backText}>←</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  back: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  backActive: { borderColor: colors.borderStrong, backgroundColor: colors.surface },
  backText: { fontFamily: fonts.bodyHeavy, fontSize: 18, color: colors.text },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.6, color: colors.text },
});
