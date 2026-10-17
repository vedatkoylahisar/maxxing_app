import { apiFetch } from './client';
import type { RoutineType } from './routines';

export type DayRoutine = {
  id: string;
  name: string;
  type: RoutineType;
  target: number | null;
  unit: string | null;
  value: number;
  completed: boolean;
  streak: number;
};

export type Day = {
  date: string; // YYYY-MM-DD, kullanıcının saat dilimine göre
  isToday: boolean;
  isEditable: boolean;
  routines: DayRoutine[];
  note: string | null;
  completedCount: number;
  totalCount: number;
  streak: { current: number; todayCompleted: boolean };
};

export type DaySummary = {
  date: string;
  completedCount: number;
  totalCount: number;
};

export function getToday(token: string) {
  return apiFetch<Day>('/days/today', { token });
}

export function getDay(token: string, date: string) {
  return apiFetch<Day>(`/days/${date}`, { token });
}

export function getHistory(token: string, from: string, to: string) {
  return apiFetch<DaySummary[]>(`/days?from=${from}&to=${to}`, { token });
}

export function setEntry(token: string, date: string, routineId: string, value: number) {
  return apiFetch<Day>(`/days/${date}/routines/${routineId}`, { method: 'PUT', body: { value }, token });
}

export function setNote(token: string, date: string, text: string) {
  return apiFetch<Day>(`/days/${date}/note`, { method: 'PUT', body: { text }, token });
}
