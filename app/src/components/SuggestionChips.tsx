import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { RoutineInput } from '@/api/routines';
import { formatNumber } from '@/dates';
import { colors, fonts } from '@/theme';
import type { PressState } from './pressableState';

export function describeRoutine(r: { type: string; target?: number | null; unit?: string | null }) {
  if (r.type === 'check') return 'Her gün · yaptım / yapmadım';
  return `Her gün · hedef ${formatNumber(r.target ?? 1)}${r.unit ? ` ${r.unit}` : ''}`;
}

export function SuggestionChips({
  suggestions,
  adding,
  onPick,
}: {
  suggestions: RoutineInput[];
  adding: string | null;
  onPick: (suggestion: RoutineInput) => void;
}) {
  return (
    <View style={styles.wrap}>
      {suggestions.map((s) => (
        <Pressable
          key={s.name}
          onPress={() => onPick(s)}
          disabled={adding !== null}
          accessibilityRole="button"
          style={(state) => [styles.chip, ((state as PressState).hovered || state.pressed) && styles.chipActive]}
        >
          {adding === s.name ? <ActivityIndicator size="small" color={colors.accent} /> : <Text style={styles.plus}>+</Text>}
          <Text style={styles.name}>{s.name}</Text>
          {s.type === 'count' ? (
            <Text style={styles.detail}>
              {formatNumber(s.target ?? 1)} {s.unit}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
  },
  chipActive: { borderColor: colors.accent },
  plus: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.accent, width: 12, textAlign: 'center' },
  name: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  detail: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textMuted },
});
