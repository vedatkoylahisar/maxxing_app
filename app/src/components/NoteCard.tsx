import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts, webInputReset } from '@/theme';
import { Card, CardLabel } from './Card';

type Status = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_DELAY_MS = 800;
const MAX_LENGTH = 2000;

// Günün notu: yazmayı bırakınca kendiliğinden kaydedilir. Gün değişince "key" ile yeniden oluşturulmalı.
export function NoteCard({
  initialText,
  editable,
  onSave,
}: {
  initialText: string;
  editable: boolean;
  onSave: (text: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialText);
  const [status, setStatus] = useState<Status>('idle');
  const saved = useRef(initialText);
  const pending = useRef<string | null>(null);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (text === saved.current) return;
    pending.current = text;
    const timer = setTimeout(async () => {
      pending.current = null;
      setStatus('saving');
      try {
        await onSaveRef.current(text);
        saved.current = text;
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text]);

  // Ekrandan çıkarken kaydedilmemiş yazı kalmasın.
  useEffect(
    () => () => {
      if (pending.current !== null) onSaveRef.current(pending.current).catch(() => {});
    },
    [],
  );

  return (
    <Card>
      <View style={styles.top}>
        <CardLabel>{t('note.label')}</CardLabel>
        <Text style={[styles.status, status === 'error' && styles.statusError]}>
          {status === 'idle' ? '' : t(`note.${status}`)}
        </Text>
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        editable={editable}
        multiline
        maxLength={MAX_LENGTH}
        placeholder={t('note.placeholder')}
        placeholderTextColor={colors.textFaint}
        selectionColor={colors.accent}
        style={styles.input}
        textAlignVertical="top"
      />
      <View style={styles.bottom}>
        <View style={styles.lock} />
        <Text style={styles.private}>{t('note.private')}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textFaint },
  statusError: { color: colors.danger },
  input: {
    marginTop: 14,
    minHeight: 110,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    ...webInputReset,
  },
  bottom: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  lock: { width: 8, height: 8, borderRadius: 2, borderWidth: 1.5, borderColor: colors.textFaint },
  private: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textFaint },
});
