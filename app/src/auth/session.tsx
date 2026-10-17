import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getMe, type AuthResponse } from '@/api/auth';
import { ApiError } from '@/api/client';
import { readSession, writeSession } from './storage';

type Session = AuthResponse;

type SessionContextValue = {
  isLoading: boolean;
  session: Session | null;
  // Az önce kayıt olduysa true; ana sayfa bunu görünce karşılama ekranını açar.
  isNewUser: boolean;
  signIn: (auth: AuthResponse, options?: { isNew?: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
  clearNewUser: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession, SessionProvider içinde kullanılmalı.');
  return value;
}

function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    if (new Date(session.expiresAt).getTime() <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  const [isNewUser, setIsNewUser] = useState(false);

  const signIn = useCallback(async (auth: AuthResponse, options?: { isNew?: boolean }) => {
    await writeSession(JSON.stringify(auth));
    setIsNewUser(options?.isNew ?? false);
    setSession(auth);
  }, []);

  const clearNewUser = useCallback(() => setIsNewUser(false), []);

  const signOut = useCallback(async () => {
    await writeSession(null);
    setSession(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = parseSession(await readSession());
      if (cancelled) return;
      setSession(stored);
      setIsLoading(false);
      if (!stored) return;

      // Kayıtlı oturumu arka planda doğrula: kullanıcı silinmiş ya da token geçersizse çıkış yap.
      try {
        const user = await getMe(stored.token);
        if (!cancelled) setSession((current) => (current ? { ...current, user } : current));
      } catch (error) {
        if (!cancelled && error instanceof ApiError && error.status === 401) await signOut();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [signOut]);

  const value = useMemo(
    () => ({ isLoading, session, isNewUser, signIn, signOut, clearNewUser }),
    [isLoading, session, isNewUser, signIn, signOut, clearNewUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
