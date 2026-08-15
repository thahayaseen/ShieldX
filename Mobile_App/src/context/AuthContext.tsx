import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { signInWithGoogle, signOutHero, getHeroFromSupabase } from '@/lib/auth';
import { registerHeroPushToken } from '@/lib/notifications';
import type { Hero } from '@/types';

export interface MobileAuthError {
  title: string;
  message: string;
  attemptedEmail?: string;
}

/** Hero profile is pending admin verification (name = 'Unknown Hero' / codename = 'Agent_...') */
export function isHeroPending(hero: Hero): boolean {
  return (
    hero.name === 'Unknown Hero' ||
    hero.codename.startsWith('Agent_') ||
    hero.codename === 'Unknown' ||
    hero.codename === 'Agent_Pending'
  );
}

interface AuthContextType {
  hero: Hero | null;
  userEmail: string | null;
  userName: string | null;
  userAvatar: string | null;
  isAuthenticated: boolean;
  isPendingApproval: boolean;
  isLoading: boolean;
  clearanceLevel: string;
  authError: MobileAuthError | null;
  clearAuthError: () => void;
  loginWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshHeroProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [hero, setHero] = useState<Hero | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isPendingApproval, setIsPendingApproval] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clearanceLevel, setClearanceLevel] = useState<string>('UNVERIFIED');
  const [authError, setAuthError] = useState<MobileAuthError | null>(null);

  const clearAuthError = () => setAuthError(null);

  async function applySession(currentSession: Session | null) {
    setSession(currentSession);
    if (currentSession?.user) {
      const email = currentSession.user.email ?? undefined;
      const name = currentSession.user.user_metadata?.full_name ?? currentSession.user.user_metadata?.name ?? null;
      const avatar = currentSession.user.user_metadata?.avatar_url ?? null;

      setUserEmail(email ?? null);
      setUserName(name);
      setUserAvatar(avatar);
      setAuthError(null);

      // Fetch hero profile from Supabase
      const mappedHero = await getHeroFromSupabase(currentSession.user);

      if (mappedHero) {
        const pending = isHeroPending(mappedHero);
        setHero(mappedHero);
        setIsAuthenticated(true);
        setIsPendingApproval(pending);
        setClearanceLevel(pending ? 'PENDING ADMIN VERIFICATION' : 'ALPHA-GUARDIAN // VERIFIED');
        // Register FCM token for push notifications
        registerHeroPushToken(mappedHero.id);
      } else {
        setHero(null);
        setIsAuthenticated(true);
        setIsPendingApproval(true);
        setClearanceLevel('PENDING ADMIN VERIFICATION');
      }
    } else {
      setHero(null);
      setUserEmail(null);
      setUserName(null);
      setUserAvatar(null);
      setIsAuthenticated(false);
      setIsPendingApproval(false);
      setClearanceLevel('UNVERIFIED');
    }
  }

  const refreshHeroProfile = async () => {
    if (session) {
      await applySession(session);
    }
  };

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      applySession(activeSession).then(() => setIsLoading(false));
    });

    // 2. Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      applySession(activeSession).then(() => setIsLoading(false));
    });

    // 3. Supabase Realtime listener on `heroes` table
    // Instantly updates mobile UI when Admin approves/edits hero in Web App!
    const realtimeChannel = supabase
      .channel('public:heroes:mobile')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'heroes' },
        () => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) applySession(s);
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(realtimeChannel);
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
        isPendingApproval,
        isLoading,
        clearanceLevel,
        authError,
        clearAuthError,
        loginWithGoogle,
        logout,
        refreshHeroProfile,
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
