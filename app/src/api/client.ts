const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5055';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    // Alan adı (küçük harfle başlar: "email", "userName") -> ilk hata mesajı
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

type ProblemDetails = {
  title?: string;
  errors?: Record<string, string[]>;
};

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.', 0);
  }

  if (response.ok) return (await response.json()) as T;

  const problem = (await response.json().catch(() => ({}))) as ProblemDetails;
  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(problem.errors ?? {})) {
    const key = field.charAt(0).toLowerCase() + field.slice(1);
    if (messages[0]) fieldErrors[key] = messages[0];
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  throw new ApiError(
    hasFieldErrors ? 'Lütfen işaretli alanları düzelt.' : (problem.title ?? 'Bir şeyler ters gitti.'),
    response.status,
    fieldErrors,
  );
}
