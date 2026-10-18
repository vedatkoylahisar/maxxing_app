import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { createRoutine, listRoutines, routineSuggestions, type Routine, type RoutineInput } from '@/api/routines';
import { useAuthedApi } from '@/auth/useAuthedApi';
import { Button } from '@/components/Button';
import { Card, CardLabel } from '@/components/Card';
import { Checkmark } from '@/components/Checkmark';
import { FormMessage } from '@/components/FormMessage';
import type { PressState } from '@/components/pressableState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { describeRoutine, SuggestionChips } from '@/components/SuggestionChips';
import { lower } from '@/dates';
import { colors, fonts } from '@/theme';

export default function Routines() {
  const { t } = useTranslation();
  const api = useAuthedApi();
  const [routines, setRoutines] = useState<Routine[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRoutines(await api(listRoutines));
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : t('common.somethingWrong'));
    }
  }, [api, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Zaten eklenmiş önerileri gösterme.
  const names = new Set(routines?.map((r) => lower(r.name)));
  const suggestions = routineSuggestions().filter((s) => !names.has(lower(s.name)));

  async function addSuggestion(input: RoutineInput) {
    setAdding(input.name);
    try {
      await api((t) => createRoutine(t, input));
      await load();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : t('today.addFailed'));
    } finally {
      setAdding(null);
    }
  }

  return (
    <Screen>
      <ScreenHeader title={t('routines.title')} />
      <Text style={styles.intro}>{t('routines.intro')}</Text>

      {message ? (
        <View style={styles.message}>
          <FormMessage message={message} />
        </View>
      ) : null}

      {!routines ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <>
          <View style={styles.list}>
            {routines.map((routine) => (
              <Pressable
                key={routine.id}
                onPress={() => router.push({ pathname: '/routines/[id]', params: { id: routine.id } })}
                accessibilityRole="button"
                style={(state) => [
                  styles.item,
                  ((state as PressState).hovered || state.pressed) && styles.itemActive,
                ]}
              >
                <View style={[styles.kind, routine.type === 'count' && styles.kindCount]}>
                  {routine.type === 'check' ? (
                    <Checkmark size={15} color={colors.accent} />
                  ) : (
                    <Text style={styles.kindText}>#</Text>
                  )}
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {routine.name}
                  </Text>
                  <Text style={styles.itemSub}>{describeRoutine(routine)}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
            {routines.length === 0 ? <Text style={styles.none}>{t('routines.none')}</Text> : null}
          </View>

          <View style={styles.newButton}>
            <Button title={t('routines.new')} onPress={() => router.push('/routines/new')} />
          </View>

          {suggestions.length > 0 ? (
            <Card style={styles.suggestions}>
              <CardLabel>{t('routines.quickAdd')}</CardLabel>
              <SuggestionChips suggestions={suggestions} adding={adding} onPick={addSuggestion} />
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 16, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  message: { marginTop: 16 },
  loading: { paddingVertical: 60, alignItems: 'center' },

  list: { marginTop: 24, gap: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  itemActive: { borderColor: colors.borderStrong, backgroundColor: colors.surfaceHigh },
  kind: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 255, 58, 0.12)',
  },
  kindCount: { backgroundColor: colors.surfaceHigh },
  kindText: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.accent },
  itemBody: { flex: 1, gap: 3 },
  itemName: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.text },
  itemSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  chevron: { fontFamily: fonts.bodyBold, fontSize: 24, color: colors.textFaint, marginTop: -2 },
  none: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted },

  newButton: { marginTop: 18 },
  suggestions: { marginTop: 14, gap: 14 },
});
