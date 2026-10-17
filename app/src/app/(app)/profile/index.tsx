import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { changePassword, getMyProfile, type Profile } from '@/api/profile';
import { useSession } from '@/auth/session';
import { useAuthedApi } from '@/auth/useAuthedApi';
import { validatePassword } from '@/auth/validation';
import { Button } from '@/components/Button';
import { Card, CardLabel } from '@/components/Card';
import { FormMessage } from '@/components/FormMessage';
import { ProfileView } from '@/components/ProfileView';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { colors, fonts } from '@/theme';

export default function MyProfile() {
  const api = useAuthedApi();
  const { signOut } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setProfile(await api(getMyProfile));
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Bir şeyler ters gitti.');
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <ScreenHeader title="Profilin" />

      {message ? (
        <View style={styles.message}>
          <FormMessage message={message} />
        </View>
      ) : null}

      {!profile ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <>
          <View style={styles.view}>
            <ProfileView profile={profile} />
          </View>
          {!profile.bio && profile.areas.length === 0 ? (
            <Text style={styles.empty}>Kendinden biraz bahset: ne için buradasın, neye çalışıyorsun?</Text>
          ) : null}
          <View style={styles.edit}>
            <Button title="Profili düzenle" variant="ghost" onPress={() => router.push('/profile/edit')} />
          </View>

          <Text style={styles.sectionTitle}>Ayarlar</Text>
          <Card style={styles.card}>
            <CardLabel>HESAP</CardLabel>
            <Text style={styles.email}>{profile.email}</Text>
          </Card>
          <PasswordCard />
          <View style={styles.signOut}>
            <Button title="Çıkış yap" variant="ghost" onPress={signOut} />
          </View>
        </>
      )}
    </Screen>
  );
}

function PasswordCard() {
  const api = useAuthedApi();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function save() {
    const found = { currentPassword: current ? undefined : 'Mevcut şifreni gir.', newPassword: validatePassword(next) };
    setErrors(found);
    if (found.currentPassword || found.newPassword) return;

    setSaving(true);
    try {
      await api((t) => changePassword(t, current, next));
      setCurrent('');
      setNext('');
      setOpen(false);
      setDone(true);
    } catch (error) {
      setErrors(error instanceof ApiError ? { ...error.fieldErrors, form: error.message } : { form: 'Değiştirilemedi.' });
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Card style={styles.card}>
        <CardLabel>ŞİFRE</CardLabel>
        {done ? <Text style={styles.done}>Şifren değiştirildi.</Text> : null}
        <Button title="Şifreni değiştir" variant="ghost" onPress={() => setOpen(true)} />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <CardLabel>ŞİFRE</CardLabel>
      <TextField
        label="Mevcut şifre"
        value={current}
        onChangeText={setCurrent}
        error={errors.currentPassword}
        secureToggle
        autoComplete="current-password"
      />
      <TextField
        label="Yeni şifre"
        value={next}
        onChangeText={setNext}
        error={errors.newPassword}
        hint="En az 8 karakter."
        secureToggle
        autoComplete="new-password"
        onSubmitEditing={save}
      />
      {errors.form && !errors.currentPassword && !errors.newPassword ? <FormMessage message={errors.form} /> : null}
      <Button title="Kaydet" onPress={save} loading={saving} />
      <Button title="Vazgeç" variant="ghost" onPress={() => setOpen(false)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  message: { marginTop: 16 },
  loading: { paddingVertical: 60, alignItems: 'center' },
  view: { marginTop: 28 },
  empty: { marginTop: 18, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  edit: { marginTop: 20 },
  sectionTitle: { marginTop: 36, marginBottom: 12, fontFamily: fonts.displaySemi, fontSize: 18, color: colors.text },
  card: { marginTop: 10, gap: 14 },
  email: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.text },
  done: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.accent },
  signOut: { marginTop: 18 },
});
