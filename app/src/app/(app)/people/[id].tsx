import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { getProfile, type Profile } from '@/api/profile';
import { useAuthedApi } from '@/auth/useAuthedApi';
import { FormMessage } from '@/components/FormMessage';
import { ProfileView } from '@/components/ProfileView';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, fonts } from '@/theme';

// Gruptaki bir arkadaşın profili. Sadece aynı gruptaysanız açılır.
export default function PersonProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const api = useAuthedApi();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api((t) => getProfile(t, id))
      .then((p) => {
        if (p.isMe) router.replace('/profile');
        else setProfile(p);
      })
      .catch((error) =>
        setMessage(
          error instanceof ApiError && error.status === 404
            ? t('person.forbidden')
            : t('person.loadFailed'),
        ),
      );
  }, [api, id, t]);

  return (
    <Screen>
      <ScreenHeader title={t('person.title')} />
      {!profile ? (
        <View style={styles.loading}>
          {message ? <FormMessage message={message} /> : <ActivityIndicator color={colors.accent} />}
        </View>
      ) : (
        <>
          <View style={styles.view}>
            <ProfileView profile={profile} />
          </View>
          <Text style={styles.privacy}>{t('person.privacy')}</Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 60, alignItems: 'center' },
  view: { marginTop: 28 },
  privacy: { marginTop: 22, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textFaint },
});
