import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { getDay, getHistory, getToday, setEntry, setNote, type Day, type DaySummary } from '@/api/days';
import { createRoutine, ROUTINE_SUGGESTIONS, type RoutineInput } from '@/api/routines';
import { useAuthedApi } from '@/auth/useAuthedApi';
import { Brand } from '@/components/Brand';
import { Button } from '@/components/Button';
import { Card, CardLabel } from '@/components/Card';
import { FormMessage } from '@/components/FormMessage';
import { HabitGrid } from '@/components/HabitGrid';
import { NoteCard } from '@/components/NoteCard';
import type { PressState } from '@/components/pressableState';
import { RoutineRow } from '@/components/RoutineRow';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { SuggestionChips } from '@/components/SuggestionChips';
import { addDays, formatDayLabel } from '@/dates';
import { colors, fonts } from '@/theme';

const HISTORY_DAYS = 30;

type Which = 'today' | 'yesterday';

export default function Today() {
  const api = useAuthedApi();
  const [today, setToday] = useState<string | null>(null);
  const [which, setWhich] = useState<Which>('today');
  const [day, setDay] = useState<Day | null>(null);
  const [history, setHistory] = useState<DaySummary[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  // Tiklemeler sırayla gönderilir; ekrana sadece son isteğin cevabı yazılır, böylece hızlı dokunuşlar birbirini ezmez.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const latestWrite = useRef(0);

  const applyDay = useCallback((next: Day) => {
    setDay(next);
    setHistory((current) =>
      current?.map((d) =>
        d.date === next.date ? { ...d, completedCount: next.completedCount, totalCount: next.totalCount } : d,
      ) ?? current,
    );
  }, []);

  const load = useCallback(
    async (target: Which) => {
      try {
        const todayDay = await api(getToday);
        setToday(todayDay.date);
        const [selected, summaries] = await Promise.all([
          target === 'today' ? todayDay : api((t) => getDay(t, addDays(todayDay.date, -1))),
          api((t) => getHistory(t, addDays(todayDay.date, -(HISTORY_DAYS - 1)), todayDay.date)),
        ]);
        setDay(selected);
        setHistory(summaries);
        setMessage(null);
      } catch (error) {
        setMessage(error instanceof ApiError ? error.message : 'Bir şeyler ters gitti.');
      }
    },
    [api],
  );

  // Rutinler sayfasından dönünce de güncel olsun.
  useFocusEffect(
    useCallback(() => {
      load(which);
    }, [load, which]),
  );

  function switchDay(next: Which) {
    if (next === which) return;
    setWhich(next);
    setDay(null);
  }

  function setValue(routineId: string, value: number) {
    if (!day) return;
    const date = day.date;

    // Önce ekranda hemen göster, sonra sunucunun cevabıyla düzelt.
    setDay((current) => {
      if (!current) return current;
      const routines = current.routines.map((r) =>
        r.id === routineId
          ? { ...r, value, completed: r.type === 'check' ? value >= 1 : value >= (r.target ?? 1) }
          : r,
      );
      return { ...current, routines, completedCount: routines.filter((r) => r.completed).length };
    });

    const writeId = ++latestWrite.current;
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        try {
          const next = await api((t) => setEntry(t, date, routineId, value));
          if (writeId === latestWrite.current) applyDay(next);
        } catch (error) {
          setMessage(error instanceof ApiError ? error.message : 'Kaydedilemedi.');
          load(which);
        }
      });
  }

  const saveNote = useCallback(
    async (date: string, text: string) => {
      const next = await api((t) => setNote(t, date, text));
      setDay((current) => (current && current.date === next.date ? { ...current, note: next.note } : current));
    },
    [api],
  );

  async function addSuggestion(input: RoutineInput) {
    setAdding(input.name);
    try {
      await api((t) => createRoutine(t, input));
      await load(which);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Rutin eklenemedi.');
    } finally {
      setAdding(null);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Brand />
        <View style={styles.headerButtons}>
          {[
            { label: 'Gruplar', href: '/groups' as const },
            { label: 'Rutinler', href: '/routines' as const },
          ].map((item) => (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href)}
              accessibilityRole="button"
              style={(state) => [
                styles.headerButton,
                ((state as PressState).hovered || state.pressed) && styles.headerButtonActive,
              ]}
            >
              <Text style={styles.headerButtonText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.daySwitch}>
        <Segmented
          options={[
            { value: 'yesterday', label: 'Dün' },
            { value: 'today', label: 'Bugün' },
          ]}
          value={which}
          onChange={switchDay}
        />
      </View>

      {message ? (
        <View style={styles.message}>
          <FormMessage message={message} />
        </View>
      ) : null}

      {!day || !today || !history ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <>
          <Text style={styles.date}>{formatDayLabel(day.date)}</Text>

          <StreakCard day={day} history={history} today={today} />

          {day.routines.length === 0 ? (
            <Card style={styles.empty}>
              <CardLabel>{day.isToday ? 'BAŞLAYALIM' : 'DÜN'}</CardLabel>
              <Text style={styles.emptyTitle}>{day.isToday ? 'İlk rutinini ekle' : 'Dün aktif rutinin yoktu'}</Text>
              {day.isToday ? (
                <>
                  <Text style={styles.emptyText}>
                    Bir tanesine dokun, hemen listene eklensin. Sonra her gün tikle, serin büyüsün.
                  </Text>
                  <SuggestionChips suggestions={ROUTINE_SUGGESTIONS} adding={adding} onPick={addSuggestion} />
                  <Button title="Kendi rutinini oluştur" variant="ghost" onPress={() => router.push('/routines/new')} />
                </>
              ) : null}
            </Card>
          ) : (
            <>
              <View style={styles.sectionTop}>
                <Text style={styles.sectionTitle}>{day.isToday ? 'Bugünün rutinleri' : 'Dünün rutinleri'}</Text>
                <Text style={styles.sectionCount}>
                  {day.completedCount}/{day.totalCount}
                </Text>
              </View>
              <View style={styles.list}>
                {day.routines.map((routine) => (
                  <RoutineRow
                    key={`${day.date}-${routine.id}`}
                    routine={routine}
                    editable={day.isEditable}
                    onSetValue={(value) => setValue(routine.id, value)}
                  />
                ))}
              </View>
            </>
          )}

          <View style={styles.note}>
            <NoteCard
              key={day.date}
              initialText={day.note ?? ''}
              editable={day.isEditable}
              onSave={(text) => saveNote(day.date, text)}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

function StreakCard({ day, history, today }: { day: Day; history: DaySummary[]; today: string }) {
  const { current, todayCompleted } = day.streak;
  const left = day.isToday ? day.totalCount - day.completedCount : 0;

  let status: string;
  if (todayCompleted) status = 'Bugün tamam. Seri devam ediyor!';
  else if (!day.isToday) status = 'Dünü buradan tamamlayabilirsin.';
  else if (day.totalCount === 0) status = 'İlk rutinini tamamladığın gün serin başlayacak.';
  else if (current > 0) status = `Seriyi korumak için ${left} rutin kaldı.`;
  else status = `Bugün ${left} rutini tamamla, serin başlasın.`;

  const levels = history.map((d) => {
    if (d.totalCount === 0 || d.completedCount === 0) return 0;
    if (d.completedCount === d.totalCount) return 3;
    return d.completedCount / d.totalCount >= 0.5 ? 2 : 1;
  });
  const todayIndex = history.findIndex((d) => d.date === today);

  return (
    <Card style={styles.streakCard}>
      <View style={styles.streakTop}>
        <CardLabel>GÜNLÜK SERİ</CardLabel>
        {todayCompleted ? (
          <View style={styles.doneChip}>
            <Text style={styles.doneChipText}>Bugün tamam</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.streakRow}>
        <Text style={styles.streakNumber}>{current}</Text>
        <Text style={styles.streakUnit}>gün</Text>
      </View>
      <Text style={styles.streakStatus}>{status}</Text>

      <View style={styles.gridTop}>
        <CardLabel>SON 30 GÜN</CardLabel>
      </View>
      <HabitGrid levels={levels} pulseIndex={todayCompleted ? undefined : todayIndex} />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerButton: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: colors.border },
  headerButtonActive: { borderColor: colors.borderStrong, backgroundColor: colors.surface },
  headerButtonText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },

  daySwitch: { marginTop: 28 },
  message: { marginTop: 16 },
  loading: { paddingVertical: 80, alignItems: 'center' },

  date: {
    marginTop: 22,
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: -0.8,
    color: colors.text,
    textTransform: 'capitalize',
  },

  streakCard: { marginTop: 18 },
  streakTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 26 },
  doneChip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.accent },
  doneChipText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.accentInk },
  streakRow: { marginTop: 8, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  streakNumber: { fontFamily: fonts.display, fontSize: 72, lineHeight: 80, letterSpacing: -3, color: colors.accent },
  streakUnit: { marginBottom: 14, fontFamily: fonts.displaySemi, fontSize: 18, color: colors.text },
  streakStatus: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  gridTop: { marginTop: 22, marginBottom: 12 },

  empty: { marginTop: 14, gap: 14 },
  emptyTitle: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.text },
  emptyText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted },

  sectionTop: { marginTop: 28, marginBottom: 12, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.displaySemi, fontSize: 18, color: colors.text },
  sectionCount: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.textMuted },
  list: { gap: 10 },

  note: { marginTop: 14 },
});
