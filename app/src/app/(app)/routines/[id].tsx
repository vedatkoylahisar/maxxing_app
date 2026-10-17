import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { createRoutine, deleteRoutine, listRoutines, updateRoutine, type RoutineType } from '@/api/routines';
import { useAuthedApi } from '@/auth/useAuthedApi';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import type { PressState } from '@/components/pressableState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { TextField } from '@/components/TextField';
import { confirm } from '@/confirm';
import { colors, fonts } from '@/theme';

// "/routines/new" yeni rutin, "/routines/<id>" düzenleme.
export default function RoutineForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const api = useAuthedApi();

  const [loaded, setLoaded] = useState(isNew);
  const [name, setName] = useState('');
  const [type, setType] = useState<RoutineType>('check');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api(listRoutines)
      .then((routines) => {
        const routine = routines.find((r) => r.id === id);
        if (!routine) {
          router.replace('/routines');
          return;
        }
        setName(routine.name);
        setType(routine.type);
        setTarget(routine.target ? String(routine.target) : '');
        setUnit(routine.unit ?? '');
        setLoaded(true);
      })
      .catch((error) => setMessage(error instanceof ApiError ? error.message : 'Rutin yüklenemedi.'));
  }, [api, id, isNew]);

  async function save() {
    const targetValue = parseInt(target.replace(/\D/g, ''), 10);
    const next: Record<string, string | undefined> = {
      name: name.trim() ? undefined : 'Rutin adı gerekli.',
      target: type === 'count' && !(targetValue >= 1) ? 'Bir hedef gir (örn. 10000).' : undefined,
    };
    setErrors(next);
    setMessage(null);
    if (next.name || next.target) return;

    const body = {
      name: name.trim(),
      target: type === 'count' ? targetValue : null,
      unit: type === 'count' ? unit.trim() || null : null,
    };

    setSaving(true);
    try {
      if (isNew) await api((t) => createRoutine(t, { ...body, type }));
      else await api((t) => updateRoutine(t, id, body));
      router.back();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        setMessage(error.message);
      } else {
        setMessage('Kaydedilemedi.');
      }
      setSaving(false);
    }
  }

  async function remove() {
    const question = `"${name}" silinsin mi? Geçmiş günlerdeki kayıtların ve serin korunur.`;
    if (!(await confirm('Rutini sil', question, 'Sil'))) return;

    setDeleting(true);
    try {
      await api((t) => deleteRoutine(t, id));
      router.back();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Silinemedi.');
      setDeleting(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title={isNew ? 'Yeni rutin' : 'Rutini düzenle'} />

      {!loaded ? (
        <View style={styles.loading}>{message ? <FormMessage message={message} /> : <ActivityIndicator color={colors.accent} />}</View>
      ) : (
        <View style={styles.form}>
          <TextField
            label="Ad"
            value={name}
            onChangeText={setName}
            error={errors.name}
            placeholder="Spor, kitap, meditasyon…"
            maxLength={40}
            autoFocus={isNew}
            returnKeyType="done"
          />

          {isNew ? (
            <View style={styles.typeBlock}>
              <Text style={styles.label}>Nasıl takip edilecek?</Text>
              <Segmented
                options={[
                  { value: 'check', label: 'Yaptım / yapmadım' },
                  { value: 'count', label: 'Sayı hedefi' },
                ]}
                value={type}
                onChange={setType}
              />
              <Text style={styles.hint}>
                {type === 'check'
                  ? 'Gün içinde bir kere tiklersin. Spor, cilt bakımı gibi.'
                  : 'Gün içinde miktar girersin; hedefe ulaşınca tamamlanır. Adım, su, sayfa gibi.'}
              </Text>
            </View>
          ) : null}

          {type === 'count' ? (
            <View style={styles.countFields}>
              <View style={styles.targetField}>
                <TextField
                  label="Günlük hedef"
                  value={target}
                  onChangeText={(text) => setTarget(text.replace(/\D/g, ''))}
                  error={errors.target}
                  placeholder="10000"
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={7}
                />
              </View>
              <View style={styles.unitField}>
                <TextField
                  label="Birim"
                  value={unit}
                  onChangeText={setUnit}
                  error={errors.unit}
                  placeholder="adım"
                  maxLength={16}
                />
              </View>
            </View>
          ) : null}

          <FormMessage message={message} />
          <Button title={isNew ? 'Rutini ekle' : 'Kaydet'} onPress={save} loading={saving} />

          {!isNew ? (
            <Pressable
              onPress={remove}
              disabled={deleting}
              accessibilityRole="button"
              style={(state) => [styles.delete, ((state as PressState).hovered || state.pressed) && styles.deleteActive]}
            >
              {deleting ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.deleteText}>Rutini sil</Text>}
            </Pressable>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 60, alignItems: 'center' },
  form: { marginTop: 28, gap: 20 },
  typeBlock: { gap: 10 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted, letterSpacing: 0.2 },
  hint: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textFaint },
  countFields: { flexDirection: 'row', gap: 12 },
  targetField: { flex: 3 },
  unitField: { flex: 2 },
  delete: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 91, 0.3)',
  },
  deleteActive: { backgroundColor: 'rgba(255, 107, 91, 0.08)', borderColor: colors.danger },
  deleteText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.danger },
});
