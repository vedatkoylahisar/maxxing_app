import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

// compact: sadece işaret, yazı yok (dar başlıklarda).
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={styles.mark} />
      {compact ? null : <Text style={styles.word}>maxxing</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 14, height: 14, borderRadius: 4, backgroundColor: colors.accent, transform: [{ rotate: '45deg' }] },
  word: { fontFamily: fonts.displaySemi, fontSize: 17, color: colors.text, letterSpacing: -0.3 },
});
