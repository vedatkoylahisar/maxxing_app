import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { createGroup, joinGroup, listGroups, type Group } from '@/api/groups';
import { useAuthedApi } from '@/auth/useAuthedApi';
import { Button } from '@/components/Button';
import { Card, CardLabel } from '@/components/Card';
import { FormMessage } from '@/components/FormMessage';
import type { PressState } from '@/components/pressableState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { upperFirst } from '@/dates';
import { colors, fonts } from '@/theme';

export default function Groups() {
  const { t } = useTranslation();
  const api = useAuthedApi();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [creating, setCreating] = useState(false);

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string>();
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    try {
      setGroups(await api(listGroups));
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

  function openGroup(id: string) {
    router.push({ pathname: '/groups/[id]', params: { id } });
  }

  async function create() {
    if (!name.trim()) {
      setNameError(t('groups.nameRequired'));
      return;
    }
    setNameError(undefined);
    setCreating(true);
    try {
      const group = await api((t) => createGroup(t, name.trim()));
      setName('');
      openGroup(group.id);
    } catch (error) {
      if (error instanceof ApiError) setNameError(error.fieldErrors.name ?? error.message);
      else setNameError(t('groups.createFailed'));
    } finally {
      setCreating(false);
    }
  }

  async function join() {
    if (code.replace(/[^a-zA-Z0-9]/g, '').length < 6) {
      setCodeError(t('groups.codeLength'));
      return;
    }
    setCodeError(undefined);
    setJoining(true);
    try {
      const group = await api((t) => joinGroup(t, code));
      setCode('');
      openGroup(group.id);
    } catch (error) {
      setCodeError(error instanceof ApiError ? error.message : t('groups.joinFailed'));
    } finally {
      setJoining(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title={t('groups.title')} />
      <Text style={styles.intro}>{t('groups.intro')}</Text>

      {message ? (
        <View style={styles.message}>
          <FormMessage message={message} />
        </View>
      ) : null}

      {!groups ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : groups.length > 0 ? (
        <View style={styles.list}>
          {groups.map((group) => (
            <Pressable
              key={group.id}
              onPress={() => openGroup(group.id)}
              accessibilityRole="button"
              style={(state) => [styles.item, ((state as PressState).hovered || state.pressed) && styles.itemActive]}
            >
              <View style={styles.initial}>
                <Text style={styles.initialText}>{upperFirst(group.name)}</Text>
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {group.name}
                </Text>
                <Text style={styles.itemSub}>
                  {t('groups.members', { count: group.memberCount })}
                  {group.isOwner ? t('groups.youOwn') : ''}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.none}>{t('groups.none')}</Text>
      )}

      <Card style={styles.card}>
        <CardLabel>{t('groups.createLabel')}</CardLabel>
        <TextField
          label={t('groups.nameLabel')}
          value={name}
          onChangeText={setName}
          error={nameError}
          placeholder={t('groups.namePlaceholder')}
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={create}
        />
        <Button title={t('groups.create')} onPress={create} loading={creating} />
      </Card>

      <Card style={styles.card}>
        <CardLabel>{t('groups.joinLabel')}</CardLabel>
        <TextField
          label={t('groups.codeLabel')}
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          error={codeError}
          hint={t('groups.codeHint')}
          placeholder="K7M2QX"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          returnKeyType="go"
          onSubmitEditing={join}
        />
        <Button title={t('groups.join')} variant="ghost" onPress={join} loading={joining} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 16, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  message: { marginTop: 16 },
  loading: { paddingVertical: 40, alignItems: 'center' },
  none: { marginTop: 24, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted },

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
  initial: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  initialText: { fontFamily: fonts.display, fontSize: 18, color: colors.accentInk },
  itemBody: { flex: 1, gap: 3 },
  itemName: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.text },
  itemSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  chevron: { fontFamily: fonts.bodyBold, fontSize: 24, color: colors.textFaint, marginTop: -2 },

  card: { marginTop: 18, gap: 16 },
});
