import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { getAreaCatalog, updateProfile, type CatalogArea } from '@/api/profile';
import { createRoutine, type RoutineInput } from '@/api/routines';
import { useSession } from '@/auth/session';
import { useAuthedApi } from '@/auth/useAuthedApi';
import { Brand } from '@/components/Brand';
import { Button } from '@/components/Button';
import { AreaPicker } from '@/components/AreaPicker';
import { Checkmark } from '@/components/Checkmark';
import { FormMessage } from '@/components/FormMessage';
import type { PressState } from '@/components/pressableState';
import { Screen } from '@/components/Screen';
import { describeRoutine } from '@/components/SuggestionChips';
import { colors, fonts } from '@/theme';

// Kayıttan hemen sonra: "Ne için buradasın?" → seçime göre önerilen rutinler.
export default function Welcome() {
  const api = useAuthedApi();
  const { session } = useSession();
  const [catalog, setCatalog] = useState<CatalogArea[] | null>(null);
  const [step, setStep] = useState<'areas' | 'routines'>('areas');
  const [areas, setAreas] = useState<string[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getAreaCatalog()
      .then(setCatalog)
      .catch(() => setMessage('Liste yüklenemedi.'));
  }, []);

  // Seçilen alanların önerileri; aynı isimli olanlar bir kez.
  const suggestions: RoutineInput[] = [];
  for (const area of catalog?.filter((a) => areas.includes(a.key)) ?? []) {
    for (const s of area.suggestions) if (!suggestions.some((x) => x.name === s.name)) suggestions.push(s);
  }

  function finish() {
    router.replace('/');
  }

  async function saveAreas() {
    setBusy(true);
    setMessage(null);
    try {
      await api((t) => updateProfile(t, { displayName: null, bio: null, areas }));
      const names = new Set<string>();
      for (const area of catalog?.filter((a) => areas.includes(a.key)) ?? []) for (const s of area.suggestions) names.add(s.name);
      if (names.size === 0) {
        finish();
        return;
      }
      setPicked(names);
      setStep('routines');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Kaydedilemedi.');
    } finally {
      setBusy(false);
    }
  }

  async function addRoutines() {
    setBusy(true);
    setMessage(null);
    try {
      for (const s of suggestions.filter((x) => picked.has(x.name))) await api((t) => createRoutine(t, s));
      finish();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Rutinler eklenemedi.');
      setBusy(false);
    }
  }

  function togglePick(name: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <Screen>
      <View style={styles.top}>
        <Brand />
        <Pressable onPress={finish} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.skip}>Şimdilik geç</Text>
        </Pressable>
      </View>

      <Text style={styles.step}>{step === 'areas' ? '1 / 2' : '2 / 2'}</Text>

      {step === 'areas' ? (
        <>
          <Text style={styles.title}>
            Hoş geldin{session ? `, @${session.user.userName}` : ''}.{'\n'}
            <Text style={styles.accent}>Ne için buradasın?</Text>
          </Text>
          <Text style={styles.subtitle}>Birden fazla seçebilirsin. Sana uygun rutinler önerelim.</Text>
          {!catalog ? (
            <View style={styles.loading}>
              {message ? <FormMessage message={message} /> : <ActivityIndicator color={colors.accent} />}
            </View>
          ) : (
            <View style={styles.body}>
              <AreaPicker catalog={catalog} value={areas} onChange={setAreas} />
              <FormMessage message={message} />
              <Button title={areas.length ? 'Devam' : 'Seçmeden devam et'} onPress={saveAreas} loading={busy} />
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={styles.title}>
            Bunlarla{'\n'}
            <Text style={styles.accent}>başlayalım mı?</Text>
          </Text>
          <Text style={styles.subtitle}>İstemediklerini kaldır. Hepsini sonra Rutinler sayfasından değiştirebilirsin.</Text>
          <View style={styles.body}>
            <View style={styles.list}>
              {suggestions.map((s) => {
                const on = picked.has(s.name);
                return (
                  <Pressable
                    key={s.name}
                    onPress={() => togglePick(s.name)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    style={(state) => [
                      styles.item,
                      on && styles.itemOn,
                      (state as PressState).hovered && styles.itemHover,
                    ]}
                  >
                    <View style={[styles.box, on && styles.boxOn]}>
                      {on ? <Checkmark size={16} color={colors.accentInk} weight={3} /> : null}
                    </View>
                    <View style={styles.itemBody}>
                      <Text style={styles.itemName}>{s.name}</Text>
                      <Text style={styles.itemSub}>{describeRoutine(s)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <FormMessage message={message} />
            <Button
              title={picked.size ? `${picked.size} rutini ekle` : 'Rutinsiz devam et'}
              onPress={picked.size ? addRoutines : finish}
              loading={busy}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textMuted },
  step: { marginTop: 36, fontFamily: fonts.bodyHeavy, fontSize: 12, letterSpacing: 1.4, color: colors.textFaint },
  title: { marginTop: 10, fontFamily: fonts.display, fontSize: 30, lineHeight: 38, letterSpacing: -0.8, color: colors.text },
  accent: { color: colors.accent },
  subtitle: { marginTop: 12, fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.textMuted },
  loading: { paddingVertical: 60, alignItems: 'center' },
  body: { marginTop: 28, gap: 22 },

  list: { gap: 10 },
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
  itemOn: { borderColor: 'rgba(212, 255, 58, 0.35)', backgroundColor: 'rgba(212, 255, 58, 0.05)' },
  itemHover: { borderColor: colors.borderStrong },
  box: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  itemBody: { flex: 1, gap: 3 },
  itemName: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.text },
  itemSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
});
