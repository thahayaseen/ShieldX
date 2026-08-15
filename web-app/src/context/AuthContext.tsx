import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ─── ADMIN AUTH VIA SUPABASE AUTH ────────────────────────────
// Commanders are created in Supabase Dashboard → Authentication → Users.
// Use "Invite User" or "Create User" with email + password.
// Supabase handles sessions, JWT refresh, and token persistence automatically.

export interface AuthError {
  title: string;
  message: string;
}

interface AuthContextType {
  user: User | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  clearanceLevel: string;
  authError: AuthError | null;
  clearAuthError: () => void;
  loginWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  const clearAuthError = () => setAuthError(null);

  const applySession = (session: Session | null) => {
    if (session?.user) {
      setUser(session.user);
      setUserEmail(session.user.email ?? null);
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setUser(null);
      setUserEmail(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    // Restore existing session on mount (handles page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
      setIsLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithPassword = async (email: string, password: string): Promise<{ error?: string }> => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setIsLoading(false);
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
          setAuthError({
            title: 'ACCESS DENIED',
            message: 'Invalid commander credentials. Verify your email and passphrase.',
          });
        } else if (msg.includes('confirm') || msg.includes('verified')) {
          setAuthError({
            title: 'EMAIL NOT CONFIRMED',
            message: 'Your account email has not been confirmed yet. Contact your A.E.G.I.S. administrator.',
          });
        } else if (msg.includes('rate') || msg.includes('too many')) {
          setAuthError({
            title: 'LOCKOUT DETECTED',
            message: 'Too many failed attempts. Authentication suspended. Wait 60 seconds and try again.',
          });
        } else {
          setAuthError({
            title: 'AUTHENTICATION ERROR',
            message: error.message,
          });
        }
        return { error: error.message };
      }

      // Session is applied automatically via onAuthStateChange
      return {};
    } catch (err: any) {
      setIsLoading(false);
      setAuthError({ title: 'CONNECTION ERROR', message: err.message });
      return { error: err.message };
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    await supabase.auth.signOut();
    // Session cleared automatically via onAuthStateChange
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userEmail,
        isAuthenticated,
        isLoading,
        clearanceLevel: 'DIRECTOR // LEVEL 10 CLEARANCE',
        authError,
        clearAuthError,
        loginWithPassword,
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
