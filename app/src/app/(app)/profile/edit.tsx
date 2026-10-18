import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { areaValues, getAreaCatalog, getMyProfile, updateProfile, type CatalogArea } from '@/api/profile';
import { useAuthedApi } from '@/auth/useAuthedApi';
import { AreaPicker } from '@/components/AreaPicker';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { colors, fonts } from '@/theme';

export default function EditProfile() {
  const { t } = useTranslation();
  const api = useAuthedApi();
  const [catalog, setCatalog] = useState<CatalogArea[] | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getAreaCatalog(), api(getMyProfile)])
      .then(([areaCatalog, profile]) => {
        setCatalog(areaCatalog);
        setDisplayName(profile.displayName ?? '');
        setBio(profile.bio ?? '');
        setAreas(areaValues(profile.areas));
        setUserName(profile.userName);
      })
      .catch((error) => setMessage(error instanceof ApiError ? error.message : t('person.loadFailed')));
  }, [api, t]);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      await api((t) => updateProfile(t, { displayName: displayName.trim() || null, bio: bio.trim() || null, areas }));
      router.back();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        setMessage(error.message);
      } else {
        setMessage(t('common.couldNotSave'));
      }
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title={t('editProfile.title')} />

      {!catalog ? (
        <View style={styles.loading}>
          {message ? <FormMessage message={message} /> : <ActivityIndicator color={colors.accent} />}
        </View>
      ) : (
        <View style={styles.form}>
          <TextField
            label={t('editProfile.displayName')}
            value={displayName}
            onChangeText={setDisplayName}
            error={errors.displayName}
            hint={t('editProfile.displayNameHint', { userName })}
            placeholder={t('editProfile.displayNamePlaceholder')}
            maxLength={40}
          />
          <TextField
            label={t('editProfile.bio')}
            value={bio}
            onChangeText={setBio}
            error={errors.bio}
            hint={`${bio.length}/160`}
            placeholder={t('editProfile.bioPlaceholder')}
            maxLength={160}
          />
          <View style={styles.areas}>
            <Text style={styles.label}>{t('welcome.question')}</Text>
            <AreaPicker catalog={catalog} value={areas} onChange={setAreas} />
            {errors.areas ? <Text style={styles.error}>{errors.areas}</Text> : null}
          </View>
          <FormMessage message={message} />
          <Button title={t('common.save')} onPress={save} loading={saving} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 60, alignItems: 'center' },
  form: { marginTop: 28, gap: 22 },
  areas: { gap: 10 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted, letterSpacing: 0.2 },
  error: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.danger },
});
