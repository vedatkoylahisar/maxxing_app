import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';
import type { PressState } from './pressableState';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
};

export function Button({ title, onPress, loading = false, variant = 'primary' }: Props) {
  const primary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      style={(state) => [
        styles.base,
        primary ? styles.primary : styles.ghost,
        (state as PressState).hovered && (primary ? styles.primaryHover : styles.ghostHover),
        state.pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.accentInk : colors.text} />
      ) : (
        <View style={styles.content}>
          <Text style={[styles.title, !primary && styles.ghostTitle]}>{title}</Text>
          {primary ? <Text style={styles.arrow}>→</Text> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  primary: { backgroundColor: colors.accent },
  primaryHover: { backgroundColor: '#E0FF6B' },
  ghost: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: 'transparent' },
  ghostHover: { borderColor: colors.borderStrong, backgroundColor: colors.surface },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.accentInk, letterSpacing: 0.2 },
  ghostTitle: { color: colors.text, fontFamily: fonts.bodyBold },
  arrow: { fontFamily: fonts.bodyHeavy, fontSize: 18, color: colors.accentInk },
});
