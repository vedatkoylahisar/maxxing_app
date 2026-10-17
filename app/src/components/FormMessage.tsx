import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

export function FormMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.box}>
      <View style={styles.bar} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 91, 0.1)',
  },
  bar: { width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.danger },
  text: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20, color: colors.text },
});
