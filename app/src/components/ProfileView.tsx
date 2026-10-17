import { StyleSheet, Text, View } from 'react-native';

import type { Profile } from '@/api/profile';
import { colors, fonts } from '@/theme';

export function initialOf(name: string) {
  return name.charAt(0).toLocaleUpperCase('tr-TR');
}

// Hem kendi profilinde hem grupta bir arkadaşın profilinde kullanılan üst kısım.
export function ProfileView({ profile }: { profile: Profile }) {
  const name = profile.displayName ?? profile.userName;
  const since = new Date(profile.stats.memberSince).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  return (
    <View>
      <View style={styles.head}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialOf(name)}</Text>
        </View>
        <View style={styles.names}>
          <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>
            {name}
          </Text>
          <Text style={styles.userName}>@{profile.userName}</Text>
        </View>
      </View>

      {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

      {profile.areas.length > 0 ? (
        <View style={styles.areas}>
          {profile.areas.map((area) => (
            <View key={area.key ?? area.label} style={styles.area}>
              <Text style={styles.areaText}>{area.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.stats}>
        <Stat value={profile.stats.currentStreak} label="Şu anki seri" accent />
        <Stat value={profile.stats.longestStreak} label="En uzun seri" />
        <Stat value={profile.stats.completedDays} label="Tamam gün" />
      </View>
      <Text style={styles.since}>{since} tarihinden beri burada</Text>
    </View>
  );
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent && styles.statAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  avatarText: { fontFamily: fonts.display, fontSize: 30, color: colors.accentInk },
  names: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.display, fontSize: 26, letterSpacing: -0.8, color: colors.text },
  userName: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.textMuted },

  bio: { marginTop: 18, fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.text },

  areas: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  area: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(212, 255, 58, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 58, 0.25)',
  },
  areaText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.accent },

  stats: { marginTop: 22, flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  statValue: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  statAccent: { color: colors.accent },
  statLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted },
  since: { marginTop: 12, fontFamily: fonts.body, fontSize: 13, color: colors.textFaint },
});
