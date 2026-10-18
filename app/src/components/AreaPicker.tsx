import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { CatalogArea } from '@/api/profile';
import { lower } from '@/dates';
import { colors, fonts, webInputReset } from '@/theme';
import type { PressState } from './pressableState';

const MAX_AREAS = 6;

// value: listedeki alanların anahtarı ("yks") ya da kullanıcının kendi yazdığı alan ("Satranç").
export function AreaPicker({
  catalog,
  value,
  onChange,
}: {
  catalog: CatalogArea[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const { t } = useTranslation();
  const [custom, setCustom] = useState('');
  const keys = new Set(catalog.map((a) => a.key));
  const customAreas = value.filter((v) => !keys.has(v));
  const full = value.length >= MAX_AREAS;

  function toggle(area: string) {
    if (value.includes(area)) onChange(value.filter((v) => v !== area));
    else if (!full) onChange([...value, area]);
  }

  function addCustom() {
    const text = custom.trim();
    if (!text || full) return;
    if (!value.some((v) => lower(v) === lower(text))) onChange([...value, text]);
    setCustom('');
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {catalog.map((area) => (
          <Chip
            key={area.key}
            label={area.label}
            selected={value.includes(area.key)}
            disabled={full && !value.includes(area.key)}
            onPress={() => toggle(area.key)}
          />
        ))}
        {customAreas.map((area) => (
          <Chip key={area} label={`${area}  ×`} selected onPress={() => toggle(area)} />
        ))}
      </View>

      <View style={styles.customRow}>
        <TextInput
          value={custom}
          onChangeText={setCustom}
          onSubmitEditing={addCustom}
          editable={!full}
          maxLength={30}
          placeholder={full ? t('areaPicker.max', { count: MAX_AREAS }) : t('areaPicker.customPlaceholder')}
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.accent}
          returnKeyType="done"
          style={styles.customInput}
        />
        <Pressable
          onPress={addCustom}
          disabled={!custom.trim() || full}
          accessibilityRole="button"
          style={(state) => [
            styles.addButton,
            (!custom.trim() || full) && styles.addButtonDisabled,
            ((state as PressState).hovered || state.pressed) && styles.addButtonActive,
          ]}
        >
          <Text style={styles.addText}>{t('areaPicker.add')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Chip({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      style={(state) => [
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
        !selected && ((state as PressState).hovered || state.pressed) && styles.chipHover,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 999,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipDisabled: { opacity: 0.4 },
  chipHover: { borderColor: colors.borderStrong },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  chipTextSelected: { color: colors.accentInk },

  customRow: { flexDirection: 'row', gap: 8 },
  customInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
    ...webInputReset,
  },
  addButton: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  addButtonDisabled: { opacity: 0.4 },
  addButtonActive: { borderColor: colors.accent },
  addText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
});
