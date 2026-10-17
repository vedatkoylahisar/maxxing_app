// Tarihler API'den "YYYY-MM-DD" olarak gelir ve kullanıcının gününü temsil eder; saat dilimi dönüşümü yapılmaz.

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const result = new Date(Date.UTC(y, m - 1, d + days));
  return result.toISOString().slice(0, 10);
}

export function formatDayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatNumber(value: number): string {
  return value.toLocaleString('tr-TR');
}
