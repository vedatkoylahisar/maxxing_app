import { apiFetch } from './client';

export type User = {
  id: string;
  email: string;
  userName: string;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  expiresAt: string;
  user: User;
};

export function register(body: { email: string; userName: string; password: string }) {
  return apiFetch<AuthResponse>('/auth/register', { method: 'POST', body });
}

export function login(body: { email: string; password: string }) {
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body });
}

export function getMe(token: string) {
  return apiFetch<User>('/auth/me', { token });
}
