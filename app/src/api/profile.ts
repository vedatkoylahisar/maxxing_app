import { apiFetch } from './client';
import type { RoutineInput } from './routines';

export type ProfileArea = { key: string | null; label: string };

export type Profile = {
  userId: string;
  userName: string;
  displayName: string | null;
  bio: string | null;
  areas: ProfileArea[];
  stats: { currentStreak: number; longestStreak: number; completedDays: number; memberSince: string };
  isMe: boolean;
  email: string | null; // sadece kendi profilinde dolu
};

export type CatalogArea = { key: string; label: string; suggestions: RoutineInput[] };

export function getAreaCatalog() {
  return apiFetch<CatalogArea[]>('/profile/areas');
}

export function getMyProfile(token: string) {
  return apiFetch<Profile>('/profile/me', { token });
}

export function getProfile(token: string, userId: string) {
  return apiFetch<Profile>(`/profile/${userId}`, { token });
}

// areas: listedeki alanların anahtarı ya da kullanıcının kendi yazdığı alan.
export function updateProfile(token: string, body: { displayName: string | null; bio: string | null; areas: string[] }) {
  return apiFetch<Profile>('/profile/me', { method: 'PUT', body, token });
}

export function changePassword(token: string, currentPassword: string, newPassword: string) {
  return apiFetch<void>('/profile/password', { method: 'POST', body: { currentPassword, newPassword }, token });
}

// Profildeki alanları düzenleme formunun beklediği değerlere çevirir.
export function areaValues(areas: ProfileArea[]) {
  return areas.map((a) => a.key ?? a.label);
}
