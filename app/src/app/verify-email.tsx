import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { resendVerificationCode, verifyEmail } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useSession } from '@/auth/session';
import { useAuthedApi } from '@/auth/useAuthedApi';
import { Brand } from '@/components/Brand';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { colors, fonts } from '@/theme';

// API'deki bekleme süresiyle aynı (maxxing_app/Email/EmailCodeService.cs → ResendCooldown).
const RESEND_COOLDOWN_SECONDS = 60;
const CODE_LENGTH = 6;

// Kayıttan sonra: e-postaya giden 6 haneli kod girilene kadar uygulamanın geri kalanı açılmaz.
export default function VerifyEmail() {
  const { t } = useTranslation();
  const api = useAuthedApi();
  const { session, isNewUser, signIn, signOut } = useSession();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  // Az önce kayıt olduysa kod yeni gönderildi; "tekrar gönder" biraz bekler.
  const [wait, setWait] = useState(isNewUser ? RESEND_COOLDOWN_SECONDS : 0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function submit(value = code) {
    if (loading) return;
    if (value.length !== CODE_LENGTH) {
      setError(t('verifyEmail.codeLength', { length: CODE_LENGTH }));
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      // Onaydan sonra "Ne için buradasın?" ekranı açılır.
      await signIn(await api((t) => verifyEmail(t, value)), { isNew: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.somethingWrong'));
      setCode('');
      setLoading(false);
    }
  }

  function changeCode(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) submit(digits);
  }

  async function resend() {
    if (resending || wait > 0) return;
    setResending(true);
    setError(null);
    setInfo(null);
    try {
      await api(resendVerificationCode);
      setInfo(t('verifyEmail.resent'));
      setCode('');
      setWait(RESEND_COOLDOWN_SECONDS);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('verifyEmail.sendFailed'));
    } finally {
      setResending(false);
    }
  }

  return (
    <Screen centered>
      <Brand />

      <Text style={styles.title}>
        {t('verifyEmail.title')}
        <Text style={styles.accent}>{t('verifyEmail.titleAccent')}</Text>
      </Text>
      <Text style={styles.subtitle}>
        <Trans
          i18nKey="verifyEmail.subtitle"
          values={{ email: session?.user.email, length: CODE_LENGTH }}
          components={{ email: <Text style={styles.email} /> }}
        />
      </Text>

      <View style={styles.form}>
        <TextField
          label={t('verifyEmail.codeLabel')}
          value={code}
          onChangeText={changeCode}
          placeholder="000000"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={CODE_LENGTH}
          autoFocus
          returnKeyType="go"
          onSubmitEditing={() => submit()}
          hint={__DEV__ ? t('verifyEmail.devHint') : undefined}
        />
        <FormMessage message={error} />
        {info ? <Text style={styles.info}>{info}</Text> : null}
        <Button title={t('verifyEmail.submit')} onPress={() => submit()} loading={loading} />

        <View style={styles.resendRow}>
          <Text style={styles.muted}>{t('verifyEmail.noCode')}</Text>
          {wait > 0 ? (
            <Text style={styles.faint}>{t('verifyEmail.resendIn', { time: formatWait(wait) })}</Text>
          ) : (
            <Pressable onPress={resend} disabled={resending} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.link}>{resending ? t('verifyEmail.sending') : t('verifyEmail.resend')}</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.spamHint}>{t('verifyEmail.spamHint')}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.muted}>{t('verifyEmail.wrongAccount')}</Text>
        <Pressable onPress={signOut} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.link}>{t('common.signOut')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function formatWait(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  title: {
    marginTop: 36,
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1,
    color: colors.text,
  },
  accent: { color: colors.accent },
  subtitle: { marginTop: 12, fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.textMuted },
  email: { fontFamily: fonts.bodyBold, color: colors.text },
  form: { marginTop: 32, gap: 18 },
  info: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20, color: colors.accent },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  spamHint: { marginTop: -8, textAlign: 'center', fontFamily: fonts.body, fontSize: 13, color: colors.textFaint },
  muted: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted },
  faint: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textFaint },
  link: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.accent },
  footer: { marginTop: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
