import { apiFetch } from './client';

export type User = {
  id: string;
  email: string;
  userName: string;
  // false ise uygulama sadece "kodu gir" ekranını gösterir; API de onaysız token'ı korumalı endpoint'lerde reddeder.
  emailVerified: boolean;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  expiresAt: string;
  user: User;
};

export function register(body: { email: string; userName: string; password: string }) {
  // "Bugün"ün hangi gün olduğu API'de bu saat dilimine göre hesaplanır.
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: { ...body, timeZone } });
}

export function login(body: { email: string; password: string }) {
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body });
}

export function getMe(token: string) {
  return apiFetch<User>('/auth/me', { token });
}

// Doğru kodda yeni token döner (eski token'da e-posta onaysız görünür).
export function verifyEmail(token: string, code: string) {
  return apiFetch<AuthResponse>('/auth/verify-email', { method: 'POST', body: { code }, token });
}

export function resendVerificationCode(token: string) {
  return apiFetch<void>('/auth/verify-email/resend', { method: 'POST', token });
}
