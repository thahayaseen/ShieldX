// ============================================================
// A.E.G.I.S. – Mobile Auth Service (Supabase Google OAuth)
// The heroes table is auto-populated by the DB trigger
// `handle_new_user` when a new Google account signs in.
// We simply fetch the hero row bound to auth.uid().
// ============================================================

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Hero, HeroStatus } from '@/types';
import { getHeroBrandColor } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

/**
 * Map raw Supabase DB hero row → typed Hero object for the app.
 */
export function formatSupabaseHero(dbHero: any): Hero {
  const statusMap: Record<string, HeroStatus> = {
    available: 'online',
    online: 'online',
    on_mission: 'on_mission',
    injured: 'busy',
    offline: 'offline',
  };

  return {
    id: dbHero.id,
    name: dbHero.name || 'Unknown Hero',
    codename: dbHero.codename || 'Unknown',
    powers: Array.isArray(dbHero.powers) ? dbHero.powers : [],
    status: statusMap[dbHero.status] ?? 'offline',
    location: dbHero.location
      ? {
          lat: dbHero.location.lat ?? 11.2588,
          lng: dbHero.location.lng ?? 75.7804,
          label: dbHero.location.city || dbHero.location.label || 'Unknown Sector',
        }
      : null,
    avatarUrl: dbHero.avatar_url ?? null,
    brandColor: getHeroBrandColor(dbHero.codename),
    createdAt: dbHero.created_at || new Date().toISOString(),
    updatedAt: dbHero.updated_at || new Date().toISOString(),
  };
}

/**
 * Fetch the hero profile for an authenticated Supabase user.
 *
 * The `handle_new_user` DB trigger auto-creates a heroes row
 * (name from Google profile, codename = "Agent_<id>", status = "offline")
 * the moment a user signs up via Google OAuth.
 *
 * We simply SELECT by user_id here.
 */
export async function getHeroFromSupabase(user: User): Promise<Hero | null> {
  try {
    const { data, error } = await supabase
      .from('heroes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      console.warn('[AEGIS Auth] No hero row found for user_id:', user.id, error?.message);
      return null;
    }

    return formatSupabaseHero(data);
  } catch (err) {
    console.error('[AEGIS Auth] getHeroFromSupabase error:', err);
    return null;
  }
}

/**
 * Initiates Google OAuth via Supabase.
 * On Web: browser redirect.
 * On Native: in-app WebBrowser session.
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
      options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('No OAuth URL returned from Supabase');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === 'success' && result.url) {
      const fragment = result.url.includes('#')
        ? result.url.split('#')[1]
        : result.url.split('?')[1];
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
        throw new Error('Sign-in cancelled or token not received.');
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

export async function signOutHero(): Promise<void> {
  await supabase.auth.signOut();
}
