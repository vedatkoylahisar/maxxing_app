import { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { DayRoutine } from '@/api/days';
import { formatNumber } from '@/dates';
import { colors, fonts, webInputReset } from '@/theme';
import { Checkmark } from './Checkmark';
import type { PressState } from './pressableState';

const useNativeDriver = Platform.OS !== 'web';

type Props = {
  routine: DayRoutine;
  editable: boolean;
  onSetValue: (value: number) => void;
};

export function RoutineRow({ routine, editable, onSetValue }: Props) {
  return routine.type === 'check' ? (
    <CheckRow routine={routine} editable={editable} onSetValue={onSetValue} />
  ) : (
    <CountRow routine={routine} editable={editable} onSetValue={onSetValue} />
  );
}

function CheckRow({ routine, editable, onSetValue }: Props) {
  const done = routine.completed;
  const [pop] = useState(() => new Animated.Value(done ? 1 : 0));

  useEffect(() => {
    Animated.spring(pop, { toValue: done ? 1 : 0, friction: 5, tension: 160, useNativeDriver }).start();
  }, [done, pop]);

  return (
    <Pressable
      onPress={() => onSetValue(done ? 0 : 1)}
      disabled={!editable}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      style={(state) => [
        styles.row,
        done && styles.rowDone,
        (state as PressState).hovered && styles.rowHover,
        state.pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.box, done && styles.boxDone]}>
        <Animated.View
          style={{ opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }}
        >
          <Checkmark size={18} color={colors.accentInk} weight={3} />
        </Animated.View>
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, done && styles.nameDone]} numberOfLines={1}>
          {routine.name}
        </Text>
        <Text style={styles.sub}>{done ? 'Tamamlandı' : 'Dokun ve tikle'}</Text>
      </View>
      <Streak days={routine.streak} />
    </Pressable>
  );
}

function CountRow({ routine, editable, onSetValue }: Props) {
  const target = routine.target ?? 1;
  const done = routine.completed;
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(String(routine.value || ''));
  const progress = Math.min(routine.value / target, 1);

  // Sunucudan yeni değer gelince (ör. "Hedefe ulaştım"), alan odakta değilse güncelle.
  const [lastValue, setLastValue] = useState(routine.value);
  if (routine.value !== lastValue) {
    setLastValue(routine.value);
    if (!focused) setText(String(routine.value || ''));
  }

  function commit() {
    setFocused(false);
    const parsed = Math.min(parseInt(text.replace(/\D/g, '') || '0', 10), 1_000_000);
    setText(String(parsed || ''));
    if (parsed !== routine.value) onSetValue(parsed);
  }

  return (
    <View style={[styles.row, styles.countRow, done && styles.rowDone]}>
      <View style={styles.countTop}>
        <View style={styles.body}>
          <Text style={[styles.name, done && styles.nameDone]} numberOfLines={1}>
            {routine.name}
          </Text>
          <Text style={styles.sub}>
            Hedef {formatNumber(target)}
            {routine.unit ? ` ${routine.unit}` : ''}
          </Text>
        </View>
        <Streak days={routine.streak} />
      </View>

      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }, done && styles.barFillDone]} />
      </View>

      <View style={styles.countBottom}>
        <View style={[styles.input, focused && styles.inputFocused]}>
          <TextInput
            value={focused ? text : text ? formatNumber(Number(text)) : ''}
            onChangeText={setText}
            onFocus={() => setFocused(true)}
            onBlur={commit}
            onSubmitEditing={commit}
            editable={editable}
            keyboardType="number-pad"
            inputMode="numeric"
            returnKeyType="done"
            placeholder="0"
            placeholderTextColor={colors.textFaint}
            selectionColor={colors.accent}
            style={styles.inputText}
          />
          {routine.unit ? (
            <Text style={styles.inputUnit} numberOfLines={1}>
              {routine.unit}
            </Text>
          ) : null}
        </View>
        {!done && editable ? (
          <Pressable
            onPress={() => onSetValue(target)}
            accessibilityRole="button"
            style={(state) => [styles.fill, ((state as PressState).hovered || state.pressed) && styles.fillActive]}
          >
            <Text style={styles.fillText}>Hedefe ulaştım</Text>
          </Pressable>
        ) : done ? (
          <View style={styles.doneChip}>
            <Checkmark size={13} color={colors.accentInk} weight={2.5} />
            <Text style={styles.doneChipText}>Tamam</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Streak({ days }: { days: number }) {
  if (days <= 0) return null;
  return (
    <View style={styles.streak}>
      <View style={styles.streakDot} />
      <Text style={styles.streakText}>{days} gün</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowDone: { borderColor: 'rgba(212, 255, 58, 0.35)', backgroundColor: 'rgba(212, 255, 58, 0.05)' },
  rowHover: { borderColor: colors.borderStrong },
  rowPressed: { transform: [{ scale: 0.985 }] },

  box: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: { backgroundColor: colors.accent, borderColor: colors.accent },

  body: { flex: 1, gap: 3 },
  name: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.text },
  nameDone: { color: colors.accent },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },

  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(212, 255, 58, 0.1)',
  },
  streakDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  streakText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.accent },

  countRow: { flexDirection: 'column', alignItems: 'stretch', gap: 14 },
  countTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: 'rgba(212, 255, 58, 0.55)' },
  barFillDone: { backgroundColor: colors.accent },
  countBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  inputFocused: { borderColor: colors.accent },
  inputText: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.bodyHeavy,
    fontSize: 16,
    color: colors.text,
    ...webInputReset,
  },
  inputUnit: { marginLeft: 8, maxWidth: '50%', fontFamily: fonts.bodySemi, fontSize: 14, color: colors.textMuted },
  fill: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fillActive: { borderColor: colors.accent },
  fillText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  doneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  doneChipText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.accentInk },
});
