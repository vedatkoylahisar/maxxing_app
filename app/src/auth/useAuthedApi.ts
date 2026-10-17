import { useCallback } from 'react';

import { ApiError } from '@/api/client';
import { useSession } from './session';

// Giriş gerektiren API çağrıları için: token'ı verir, oturum düşmüşse (401) çıkış yapar.
export function useAuthedApi() {
  const { session, signOut } = useSession();
  const token = session?.token;

  return useCallback(
    async <T>(call: (token: string) => Promise<T>): Promise<T> => {
      if (!token) throw new ApiError('Oturum bulunamadı.', 401);
      try {
        return await call(token);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) await signOut();
        throw error;
      }
    },
    [token, signOut],
  );
}
