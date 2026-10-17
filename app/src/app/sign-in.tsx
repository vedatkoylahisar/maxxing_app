import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View, type TextInputInstance } from 'react-native';

import { login } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useSession } from '@/auth/session';
import { validateEmail } from '@/auth/validation';
import { Brand } from '@/components/Brand';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { HabitGrid } from '@/components/HabitGrid';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { colors, fonts } from '@/theme';

// Son 30 gün: başlarda arada boşluklar, sonda 12 günlük kesintisiz seri, en sondaki "bugün" yanıp söner.
const LAST_30_DAYS = [0, 2, 1, 0, 3, 2, 0, 1, 3, 0, 2, 3, 1, 0, 2, 3, 3, 0, 2, 3, 3, 2, 3, 3, 3, 2, 3, 3, 3, 3];

export default function SignIn() {
  const { signIn } = useSession();
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const next = { email: validateEmail(email), password: password ? undefined : 'Şifre gerekli.' };
    setErrors(next);
    setMessage(null);
    if (next.email || next.password) return;

    setLoading(true);
    try {
      await signIn(await login({ email: email.trim(), password }));
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        setMessage(error.message);
      } else {
        setMessage('Bir şeyler ters gitti.');
      }
      setLoading(false);
    }
  }

  return (
    <Screen centered>
      <Brand />

      <View style={styles.hero}>
        <View style={styles.gridHeader}>
          <Text style={styles.gridLabel}>SON 30 GÜN</Text>
          <View style={styles.streakPill}>
            <View style={styles.streakDot} />
            <Text style={styles.streakText}>12 günlük seri</Text>
          </View>
        </View>
        <HabitGrid levels={LAST_30_DAYS} pulseIndex={LAST_30_DAYS.length - 1} />
      </View>

      <Text style={styles.title}>
        Her gün{'\n'}biraz daha <Text style={styles.titleAccent}>iyi.</Text>
      </Text>
      <Text style={styles.subtitle}>Rutinlerini tikle, serini koru, arkadaşlarınla yarış.</Text>

      <View style={styles.form}>
        <TextField
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          placeholder="sen@ornek.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          placeholder="••••••••"
          secureToggle
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <FormMessage message={message} />
        <Button title="Giriş yap" onPress={submit} loading={loading} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Hesabın yok mu? </Text>
        <Link href="/sign-up" replace style={styles.footerLink}>
          Kayıt ol
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
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(212, 255, 58, 0.12)',
  },
  streakDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  streakText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.accent },
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
