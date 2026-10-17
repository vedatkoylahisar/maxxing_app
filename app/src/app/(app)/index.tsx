import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/auth/session';
import { Brand } from '@/components/Brand';
import { Screen } from '@/components/Screen';
import type { PressState } from '@/components/pressableState';
import { colors, fonts } from '@/theme';

const WEEK_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function Home() {
  const { session, signOut } = useSession();
  const user = session!.user;

  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7; // Pazartesi = 0
  const dateLabel = today.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Screen>
      <View style={styles.header}>
        <Brand />
        <Pressable
          onPress={signOut}
          accessibilityRole="button"
          style={(state) => [styles.signOut, ((state as PressState).hovered || state.pressed) && styles.signOutActive]}
        >
          <Text style={styles.signOutText}>Çıkış</Text>
        </Pressable>
      </View>

      <Text style={styles.date}>{dateLabel}</Text>
      <Text style={styles.greeting}>Selam,</Text>
      <Text style={styles.userName} numberOfLines={1} adjustsFontSizeToFit>
        @{user.userName}
      </Text>

      <View style={styles.streakCard}>
        <View style={styles.streakTop}>
          <Text style={styles.cardLabel}>GÜNLÜK SERİ</Text>
          <Text style={styles.streakBadge}>Başlamadı</Text>
        </View>
        <View style={styles.streakRow}>
          <Text style={styles.streakNumber}>0</Text>
          <Text style={styles.streakUnit}>gün</Text>
        </View>
        <Text style={styles.cardText}>İlk rutinini tamamladığın gün serin başlayacak.</Text>

        <View style={styles.week}>
          {WEEK_DAYS.map((day, i) => {
            const isToday = i === todayIndex;
            return (
              <View key={day} style={styles.weekDay}>
                <View style={[styles.weekDot, isToday && styles.weekDotToday]} />
                <Text style={[styles.weekLabel, isToday && styles.weekLabelToday]}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.nextCard}>
        <View style={styles.nextTop}>
          <Text style={styles.cardLabel}>SIRADAKİ</Text>
          <View style={styles.soonChip}>
            <Text style={styles.soonText}>Yakında</Text>
          </View>
        </View>
        <Text style={styles.nextTitle}>Rutinlerini belirle</Text>
        <Text style={styles.cardText}>
          Spor, 10 bin adım, cilt bakımı… Her gün neyi tikleyeceğine sen karar vereceksin.
        </Text>
      </View>
    </Screen>
  );
}

const card = {
  padding: 22,
  borderRadius: 24,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.surface,
} as const;

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  signOut: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: colors.border },
  signOutActive: { borderColor: colors.borderStrong, backgroundColor: colors.surface },
  signOutText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted },

  date: { marginTop: 40, fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted, textTransform: 'capitalize' },
  greeting: { marginTop: 10, fontFamily: fonts.displaySemi, fontSize: 22, color: colors.textMuted },
  userName: { marginTop: 2, fontFamily: fonts.display, fontSize: 34, letterSpacing: -1, color: colors.text },

  streakCard: { ...card, marginTop: 32 },
  streakTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { fontFamily: fonts.bodyHeavy, fontSize: 11, letterSpacing: 1.4, color: colors.textMuted },
  streakBadge: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textFaint },
  streakRow: { marginTop: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  streakNumber: { fontFamily: fonts.display, fontSize: 72, lineHeight: 78, color: colors.accent, letterSpacing: -3 },
  streakUnit: { marginBottom: 14, fontFamily: fonts.displaySemi, fontSize: 18, color: colors.text },
  cardText: { marginTop: 8, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted },

  week: { marginTop: 22, flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 8 },
  weekDot: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekDotToday: { borderWidth: 2, borderColor: colors.accent },
  weekLabel: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.textFaint },
  weekLabelToday: { color: colors.accent },

  nextCard: { ...card, marginTop: 14 },
  nextTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  soonChip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.surfaceHigh },
  soonText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textMuted },
  nextTitle: { marginTop: 14, fontFamily: fonts.displaySemi, fontSize: 20, color: colors.text },
});
