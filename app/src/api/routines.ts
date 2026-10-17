import { apiFetch } from './client';

export type RoutineType = 'check' | 'count';

export type Routine = {
  id: string;
  name: string;
  type: RoutineType;
  target: number | null;
  unit: string | null;
  startDate: string;
};

export type RoutineInput = {
  name: string;
  type: RoutineType;
  target?: number | null;
  unit?: string | null;
};

export function listRoutines(token: string) {
  return apiFetch<Routine[]>('/routines', { token });
}

export function createRoutine(token: string, body: RoutineInput) {
  return apiFetch<Routine>('/routines', { method: 'POST', body, token });
}

export function updateRoutine(token: string, id: string, body: Omit<RoutineInput, 'type'>) {
  return apiFetch<Routine>(`/routines/${id}`, { method: 'PUT', body, token });
}

export function deleteRoutine(token: string, id: string) {
  return apiFetch<void>(`/routines/${id}`, { method: 'DELETE', token });
}

// Boş başlayan kullanıcıya tek dokunuşla eklenebilecek öneriler.
export const ROUTINE_SUGGESTIONS: RoutineInput[] = [
  { name: 'Spor', type: 'check' },
  { name: 'Yürüyüş', type: 'count', target: 10000, unit: 'adım' },
  { name: 'Cilt bakımı', type: 'check' },
  { name: 'Su', type: 'count', target: 8, unit: 'bardak' },
  { name: 'Kitap', type: 'count', target: 20, unit: 'sayfa' },
];
