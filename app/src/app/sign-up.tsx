import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, type TextInputInstance } from 'react-native';

import { register } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useSession } from '@/auth/session';
import { validateEmail, validatePassword, validateUserName } from '@/auth/validation';
import { Brand } from '@/components/Brand';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { HabitGrid } from '@/components/HabitGrid';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { colors, fonts } from '@/theme';

// Boş bir takvim; ilk gün yanıp söner: "her şey ilk günle başlar".
const EMPTY_30_DAYS = Array.from({ length: 30 }, () => 0);

export default function SignUp() {
  const { t } = useTranslation();
  const { signIn } = useSession();
  const userNameRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const next = {
      email: validateEmail(email),
      userName: validateUserName(userName),
      password: validatePassword(password),
    };
    setErrors(next);
    setMessage(null);
    if (next.email || next.userName || next.password) return;

    setLoading(true);
    try {
      await signIn(await register({ email: email.trim(), userName, password }), { isNew: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        setMessage(error.message);
      } else {
        setMessage(t('common.somethingWrong'));
      }
      setLoading(false);
    }
  }

  return (
    <Screen centered>
      <Brand />

      <View style={styles.hero}>
        <View style={styles.gridHeader}>
          <Text style={styles.gridLabel}>{t('signUp.gridLabel')}</Text>
          <Text style={styles.dayOne}>{t('signUp.dayOne')}</Text>
        </View>
        <HabitGrid levels={EMPTY_30_DAYS} pulseIndex={0} />
      </View>

      <Text style={styles.title}>
        {t('signUp.title')}
        <Text style={styles.titleAccent}>{t('signUp.titleAccent')}</Text>
      </Text>
      <Text style={styles.subtitle}>{t('signUp.subtitle')}</Text>

      <View style={styles.form}>
        <TextField
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          placeholder={t('auth.emailPlaceholder')}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => userNameRef.current?.focus()}
        />
        <TextField
          ref={userNameRef}
          label={t('signUp.userName')}
          prefix="@"
          value={userName}
          onChangeText={(text) => setUserName(text.toLowerCase())}
          error={errors.userName}
          hint={t('signUp.userNameHint')}
          placeholder={t('signUp.userNamePlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username-new"
          maxLength={20}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          hint={password.length >= 8 ? t('signUp.passwordOk') : t('auth.passwordHint')}
          placeholder="••••••••"
          secureToggle
          autoComplete="new-password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <FormMessage message={message} />
        <Button title={t('signUp.submit')} onPress={submit} loading={loading} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('signUp.haveAccount')}</Text>
        <Link href="/sign-in" replace style={styles.footerLink}>
          {t('signUp.signInLink')}
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 36,
    padding: 18,
    gap: 14,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gridLabel: { fontFamily: fonts.bodyHeavy, fontSize: 11, letterSpacing: 1.4, color: colors.textMuted },
  dayOne: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.accent },
  title: {
    marginTop: 36,
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1,
    color: colors.text,
  },
  titleAccent: { color: colors.accent },
  subtitle: { marginTop: 12, fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.textMuted },
  form: { marginTop: 32, gap: 18 },
  footer: { marginTop: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted },
  footerLink: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.accent },
});
