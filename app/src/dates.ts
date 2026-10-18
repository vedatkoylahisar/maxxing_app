import { getLocale } from '@/i18n';

// Tarihler API'den "YYYY-MM-DD" olarak gelir ve kullanıcının gününü temsil eder; saat dilimi dönüşümü yapılmaz.

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const result = new Date(Date.UTC(y, m - 1, d + days));
  return result.toISOString().slice(0, 10);
}

export function formatDayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(getLocale(), { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatMonthYear(date: string): string {
  return new Date(date).toLocaleDateString(getLocale(), { month: 'long', year: 'numeric' });
}

export function formatNumber(value: number): string {
  return value.toLocaleString(getLocale());
}

// Baş harf ve büyük/küçük harf karşılaştırması dile göre ("i" → Türkçede "İ", İngilizcede "I").
export function upperFirst(text: string): string {
  return text.charAt(0).toLocaleUpperCase(getLocale());
}

export function lower(text: string): string {
  return text.toLocaleLowerCase(getLocale());
}
