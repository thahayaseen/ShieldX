import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { signInWithGoogle, signOutHero, getHeroFromSupabase } from '@/lib/auth';
import type { Hero } from '@/types';

export interface MobileAuthError {
  title: string;
  message: string;
  attemptedEmail?: string;
}

interface AuthContextType {
  hero: Hero | null;
  userEmail: string | null;
  userName: string | null;
  userAvatar: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  clearanceLevel: string;
  authError: MobileAuthError | null;
  clearAuthError: () => void;
  loginWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hero, setHero] = useState<Hero | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clearanceLevel, setClearanceLevel] = useState<string>('UNVERIFIED');
  const [authError, setAuthError] = useState<MobileAuthError | null>(null);

  const clearAuthError = () => setAuthError(null);

  async function applySession(session: Session | null) {
    if (session?.user) {
      const email = session.user.email ?? undefined;
      const name = session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? null;
      const avatar = session.user.user_metadata?.avatar_url ?? null;

      // Query Supabase heroes table dynamically
      const mappedHero = await getHeroFromSupabase(session.user);

      if (mappedHero) {
        setHero(mappedHero);
        setUserEmail(email ?? null);
        setUserName(name);
        setUserAvatar(avatar);
        setIsAuthenticated(true);
        setClearanceLevel('ALPHA-GUARDIAN // VERIFIED');
        setAuthError(null);
      } else {
        // Revoke session for unauthorized users
        supabase.auth.signOut();
        setHero(null);
        setUserEmail(null);
        setUserName(null);
        setUserAvatar(null);
        setIsAuthenticated(false);
        setClearanceLevel('UNVERIFIED');
        setAuthError({
          title: 'UNAUTHORIZED HERO ACCOUNT',
          message: 'No active hero profile found in the Supabase database for your account.',
          attemptedEmail: email ?? 'Unknown Email',
        });
      }
    } else {
      setHero(null);
      setUserEmail(null);
      setUserName(null);
      setUserAvatar(null);
      setIsAuthenticated(false);
      setClearanceLevel('UNVERIFIED');
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session).then(() => setIsLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session).then(() => setIsLoading(false));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async (): Promise<{ error?: string }> => {
    setAuthError(null);
    setIsLoading(true);
    const result = await signInWithGoogle();
    if (result.error) {
      setIsLoading(false);
      setAuthError({
        title: 'AUTHENTICATION ERROR',
        message: result.error,
      });
    }
    return result;
  };

  const logout = async () => {
    setIsLoading(true);
    await signOutHero();
  };

  return (
    <AuthContext.Provider
      value={{
        hero,
        userEmail,
        userName,
        userAvatar,
        isAuthenticated,
        isLoading,
        clearanceLevel,
        authError,
        clearAuthError,
        loginWithGoogle,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
