import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

const COLUMNS = 10;
const useNativeDriver = Platform.OS !== 'web';

// Son 30 günü gösteren dekoratif ızgara. levels: her gün için 0 (boş) - 3 (tam dolu).
export function HabitGrid({ levels, pulseIndex }: { levels: number[]; pulseIndex?: number }) {
  const [appear] = useState(() => levels.map(() => new Animated.Value(0)));
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.stagger(
      22,
      appear.map((value) =>
        Animated.timing(value, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver }),
      ),
    ).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [appear, pulse]);

  const rows: number[][] = [];
  for (let i = 0; i < levels.length; i += COLUMNS) rows.push(levels.slice(i, i + COLUMNS).map((_, j) => i + j));

  return (
    <View style={styles.grid}>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((index) => {
            const level = levels[index];
            const isPulse = index === pulseIndex;
            const opacity = isPulse
              ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] })
              : Animated.multiply(appear[index], LEVEL_OPACITY[level]);
            const scale = appear[index].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

            return (
              <Animated.View
                key={index}
                style={[styles.cell, level > 0 || isPulse ? styles.filled : styles.empty, { opacity, transform: [{ scale }] }]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const LEVEL_OPACITY = [1, 0.28, 0.6, 1];

const styles = StyleSheet.create({
  grid: { gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 7 },
  filled: { backgroundColor: colors.accent },
  empty: { backgroundColor: colors.surfaceHigh, borderWidth: 1, borderColor: colors.border },
});
