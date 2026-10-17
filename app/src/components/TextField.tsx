import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { colors, fonts } from '@/theme';

type Props = TextInputProps & {
  ref?: Ref<TextInputInstance>;
  label: string;
  error?: string;
  hint?: string;
  prefix?: string;
  secureToggle?: boolean;
};

export function TextField({
  ref,
  label,
  error,
  hint,
  prefix,
  secureToggle,
  onFocus,
  onBlur,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, focused && styles.boxFocused, !!error && styles.boxError]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.accent}
          secureTextEntry={secureToggle ? hidden : inputProps.secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {secureToggle ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} style={styles.toggle}>
            <Text style={styles.toggleText}>{hidden ? 'Göster' : 'Gizle'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted, letterSpacing: 0.2 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  boxFocused: { borderColor: colors.accent, backgroundColor: colors.surfaceHigh },
  boxError: { borderColor: colors.danger },
  prefix: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textMuted, marginRight: 2 },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
    outlineWidth: 0,
  },
  toggle: { paddingLeft: 12 },
  toggleText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted },
  error: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.danger },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.textFaint },
});
