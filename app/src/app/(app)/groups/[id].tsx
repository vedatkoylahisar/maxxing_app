import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { getGroup, leaveGroup, resetInviteCode, type GroupDetail, type GroupMember } from '@/api/groups';
import { useAuthedApi } from '@/auth/useAuthedApi';
import { Card, CardLabel } from '@/components/Card';
import { Checkmark } from '@/components/Checkmark';
import { FormMessage } from '@/components/FormMessage';
import type { PressState } from '@/components/pressableState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { confirm } from '@/confirm';
import { colors, fonts } from '@/theme';

export default function GroupPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useAuthedApi();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setGroup(await api((t) => getGroup(t, id)));
      setMessage(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) router.replace('/groups');
      else setMessage(error instanceof ApiError ? error.message : 'Bir şeyler ters gitti.');
    }
  }, [api, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function copyCode() {
    if (!group) return;
    await Clipboard.setStringAsync(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function resetCode() {
    const ok = await confirm('Kodu yenile', 'Yeni bir davet kodu üretilsin mi? Eski kod artık çalışmaz.', 'Yenile');
    if (!ok) return;
    setBusy(true);
    try {
      const updated = await api((t) => resetInviteCode(t, id));
      setGroup((current) => (current ? { ...current, inviteCode: updated.inviteCode } : current));
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Kod yenilenemedi.');
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (!group) return;
    const last = group.members.length === 1;
    const text = last
      ? `"${group.name}" grubundaki son kişisin. Ayrılırsan grup silinir.`
      : `"${group.name}" grubundan ayrılmak istiyor musun?`;
    if (!(await confirm('Gruptan ayrıl', text, 'Ayrıl'))) return;
    setBusy(true);
    try {
      await api((t) => leaveGroup(t, id));
      router.replace('/groups');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Ayrılamadın, tekrar dene.');
      setBusy(false);
    }
  }

  if (!group) {
    return (
      <Screen>
        <ScreenHeader title="Grup" />
        <View style={styles.loading}>
          {message ? <FormMessage message={message} /> : <ActivityIndicator color={colors.accent} />}
        </View>
      </Screen>
    );
  }

  const doneCount = group.members.filter((m) => m.todayCompleted).length;

  return (
    <Screen>
      <ScreenHeader title={group.name} />

      {message ? (
        <View style={styles.message}>
          <FormMessage message={message} />
        </View>
      ) : null}

      <Card style={styles.inviteCard}>
        <CardLabel>DAVET KODU</CardLabel>
        <View style={styles.codeRow}>
          <Text style={styles.code} selectable>
            {group.inviteCode}
          </Text>
          <Pressable
            onPress={copyCode}
            accessibilityRole="button"
            style={(state) => [styles.copy, ((state as PressState).hovered || state.pressed) && styles.copyActive]}
          >
            <Text style={styles.copyText}>{copied ? 'Kopyalandı' : 'Kopyala'}</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>Arkadaşın Gruplar → Kodla katıl kısmına bu kodu yazsın.</Text>
        {group.isOwner ? (
          <Pressable onPress={resetCode} disabled={busy} accessibilityRole="button" hitSlop={6}>
            <Text style={styles.reset}>Kodu yenile</Text>
          </Pressable>
        ) : null}
      </Card>

      <View style={styles.sectionTop}>
        <Text style={styles.sectionTitle}>Bugün</Text>
        <Text style={styles.sectionCount}>
          {doneCount}/{group.members.length} kişi tamamladı
        </Text>
      </View>

      <View style={styles.members}>
        {group.members.map((member, index) => (
          <MemberRow key={member.userId} member={member} rank={index + 1} />
        ))}
      </View>

      <Text style={styles.privacy}>Grupta sadece günlük özetin görünür. Rutinlerinin adları ve notların görünmez.</Text>

      <Pressable
        onPress={leave}
        disabled={busy}
        accessibilityRole="button"
        style={(state) => [styles.leave, ((state as PressState).hovered || state.pressed) && styles.leaveActive]}
      >
        <Text style={styles.leaveText}>Gruptan ayrıl</Text>
      </Pressable>
    </Screen>
  );
}

function MemberRow({ member, rank }: { member: GroupMember; rank: number }) {
  const progress = member.totalCount > 0 ? member.completedCount / member.totalCount : 0;
  const status = member.todayCompleted
    ? 'Bugün tamam'
    : member.totalCount === 0
      ? 'Henüz rutini yok'
      : `${member.completedCount}/${member.totalCount} tamamladı`;

  return (
    <View style={[styles.member, member.todayCompleted && styles.memberDone, member.isMe && styles.memberMe]}>
      <Text style={styles.rank}>{rank}</Text>
      <View style={[styles.avatar, member.todayCompleted && styles.avatarDone]}>
        {member.todayCompleted ? (
          <Checkmark size={16} color={colors.accentInk} weight={3} />
        ) : (
          <Text style={styles.avatarText}>{member.userName.charAt(0).toLocaleUpperCase('tr-TR')}</Text>
        )}
      </View>
      <View style={styles.memberBody}>
        <View style={styles.nameRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            @{member.userName}
          </Text>
          {member.isMe ? <Badge text="Sen" /> : null}
          {member.isOwner ? <Badge text="Kurucu" /> : null}
        </View>
        <Text style={[styles.memberStatus, member.todayCompleted && styles.memberStatusDone]}>{status}</Text>
        {!member.todayCompleted && member.totalCount > 0 ? (
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
          </View>
        ) : null}
      </View>
      <View style={styles.streak}>
        <Text style={[styles.streakNumber, member.streak === 0 && styles.streakZero]}>{member.streak}</Text>
        <Text style={styles.streakLabel}>gün</Text>
      </View>
    </View>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 60, alignItems: 'center' },
  message: { marginTop: 16 },

  inviteCard: { marginTop: 24, gap: 12 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  code: { fontFamily: fonts.display, fontSize: 30, letterSpacing: 4, color: colors.accent },
  copy: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border },
  copyActive: { borderColor: colors.accent },
  copyText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  hint: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textMuted },
  reset: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textFaint, textDecorationLine: 'underline' },

  sectionTop: { marginTop: 28, marginBottom: 12, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.displaySemi, fontSize: 18, color: colors.text },
  sectionCount: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textMuted },

  members: { gap: 10 },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  memberDone: { borderColor: 'rgba(212, 255, 58, 0.35)', backgroundColor: 'rgba(212, 255, 58, 0.05)' },
  memberMe: { borderStyle: 'dashed' },
  rank: { width: 16, fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textFaint, textAlign: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  avatarText: { fontFamily: fonts.displaySemi, fontSize: 16, color: colors.text },
  memberBody: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { flexShrink: 1, fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  badge: { flexShrink: 0, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 999, backgroundColor: colors.surfaceHigh },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.textMuted },
  memberStatus: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  memberStatusDone: { color: colors.accent, fontFamily: fonts.bodyBold },
  bar: { marginTop: 2, height: 5, borderRadius: 3, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: 'rgba(212, 255, 58, 0.55)' },
  streak: { alignItems: 'center', minWidth: 40 },
  streakNumber: { fontFamily: fonts.display, fontSize: 20, color: colors.accent },
  streakZero: { color: colors.textFaint },
  streakLabel: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.textFaint },

  privacy: { marginTop: 18, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textFaint },
  leave: {
    marginTop: 24,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 91, 0.3)',
  },
  leaveActive: { backgroundColor: 'rgba(255, 107, 91, 0.08)', borderColor: colors.danger },
  leaveText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.danger },
});
