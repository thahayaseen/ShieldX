// ============================================================
// A.E.G.I.S. – Dynamic Supabase Hero Authentication Service
// Queries real heroes table from Supabase database.
// ============================================================

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { ALL_HEROES } from '@/constants/heroes';
import type { Hero, HeroStatus } from '@/types';
import { getHeroBrandColor } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

/**
 * Format raw database hero record from Supabase into typed Hero object
 */
export function formatSupabaseHero(dbHero: any): Hero {
  const statusMap: Record<string, HeroStatus> = {
    available: 'online',
    online: 'online',
    busy: 'busy',
    on_mission: 'on_mission',
    offline: 'offline',
  };

  return {
    id: dbHero.id,
    name: dbHero.name || dbHero.codename,
    codename: dbHero.codename,
    powers: Array.isArray(dbHero.powers) ? dbHero.powers : [],
    status: statusMap[dbHero.status] || 'online',
    location: dbHero.location
      ? {
          lat: dbHero.location.lat ?? 11.2588,
          lng: dbHero.location.lng ?? 75.7804,
          label: dbHero.location.city || dbHero.location.label || 'Calicut Sector',
        }
      : null,
    avatarUrl: dbHero.avatar_url,
    brandColor: getHeroBrandColor(dbHero.codename),
    createdAt: dbHero.created_at || new Date().toISOString(),
    updatedAt: dbHero.updated_at || new Date().toISOString(),
  };
}

/**
 * Dynamically queries Supabase heroes table for the authenticated user.
 * 1. Checks if a hero record has user_id === user.id
 * 2. Checks if email matches a hero codename/name in Supabase
 * 3. Binds user_id in Supabase if not bound yet
 */
export async function getHeroFromSupabase(user: User): Promise<Hero | null> {
  try {
    // 1. Query Supabase heroes table by user_id
    const { data: boundHeroes } = await supabase
      .from('heroes')
      .select('*')
      .eq('user_id', user.id);

    if (boundHeroes && boundHeroes.length > 0) {
      return formatSupabaseHero(boundHeroes[0]);
    }

    // 2. Fetch all heroes from Supabase to match by email or bind first available
    const { data: allHeroes, error } = await supabase.from('heroes').select('*');

    if (error || !allHeroes || allHeroes.length === 0) {
      console.warn('[AEGIS Auth] No heroes found in Supabase database:', error);
      return null;
    }

    const email = user.email?.toLowerCase().trim() || '';

    // Match by email pattern (e.g. rafan -> spiderman, bruce -> hulk, etc.)
    const matched = allHeroes.find((h) => {
      const code = (h.codename || '').toLowerCase().replace(/[^a-z]/g, '');
      const name = (h.name || '').toLowerCase().replace(/[^a-z]/g, '');
      const cleanEmail = email.replace(/[^a-z]/g, '');
      return cleanEmail.includes(code) || cleanEmail.includes(name);
    });

    if (matched) {
      // Bind user_id in Supabase database for future logins
      await supabase.from('heroes').update({ user_id: user.id }).eq('id', matched.id);
      return formatSupabaseHero({ ...matched, user_id: user.id });
    }

    // Bind the first unbound hero in Supabase to this authenticated user
    const unbound = allHeroes.find((h) => !h.user_id);
    if (unbound) {
      await supabase.from('heroes').update({ user_id: user.id }).eq('id', unbound.id);
      return formatSupabaseHero({ ...unbound, user_id: user.id });
    }

    return null;
  } catch (err) {
    console.error('[AEGIS Supabase Hero Bind Error]:', err);
    return null;
  }
}

/**
 * Initiates Google OAuth via Supabase.
 */
export async function signInWithGoogle(): Promise<{ error?: string }> {
  try {
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
      return {};
    }

    const redirectUrl = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('No OAuth URL returned from Supabase');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === 'success' && result.url) {
      const url = result.url;
      const fragment = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
      const params = new URLSearchParams(fragment ?? '');

      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) throw sessionError;
      } else {
        throw new Error('Authentication was cancelled or token was not received.');
      }
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Sign-in was cancelled.');
    }

    return {};
  } catch (err: any) {
    console.error('[AEGIS Auth] Google OAuth error:', err.message);
    return { error: err.message };
  }
}

/**
 * Sign out of current hero session.
 */
export async function signOutHero(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('[AEGIS Auth] Sign out error:', error.message);
}
