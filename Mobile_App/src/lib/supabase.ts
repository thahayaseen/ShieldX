import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { HeroStatus, MissionStatus } from '@/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[AEGIS Supabase] Missing env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

// ─── Secure Storage adapter safely handling Web, Node SSR & Native ──
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        return Promise.resolve(localStorage.getItem(key));
      }
      return Promise.resolve(null);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ─── Direct Supabase Database Actions ─────────────────────────

/** Update Hero Status directly in Supabase DB */
export async function updateHeroStatusInSupabase(
  heroId: string,
  status: HeroStatus
): Promise<void> {
  const dbStatusMap: Record<HeroStatus, string> = {
    online: 'available',
    on_mission: 'on_mission',
    busy: 'injured',
    offline: 'offline',
  };

  const dbStatus = dbStatusMap[status] ?? 'available';

  const { error } = await supabase
    .from('heroes')
    .update({ status: dbStatus, updated_at: new Date().toISOString() })
    .eq('id', heroId);

  if (error) {
    console.error('[AEGIS Supabase] Failed to update hero status:', error.message);
  }
}

/** Update Mission Status directly in Supabase DB */
export async function updateMissionStatusInSupabase(
  missionId: string,
  status: MissionStatus
): Promise<void> {
  const dbStatusMap: Record<MissionStatus, string> = {
    pending: 'pending',
    accepted: 'accepted',
    en_route: 'en_route',
    arrived: 'arrived',
    complete: 'completed',
    failed: 'failed',
  };

  const dbStatus = dbStatusMap[status] ?? status;

  const { error } = await supabase
    .from('missions')
    .update({ status: dbStatus, updated_at: new Date().toISOString() })
    .eq('id', missionId);

  if (error) {
    console.error('[AEGIS Supabase] Failed to update mission status:', error.message);
  }
}

// ─── Realtime subscription helpers ──────────────────────────

/**
 * Subscribe to Supabase real-time changes on a table.
 */
export function subscribeToTable(
  table: 'heroes' | 'missions' | 'incidents' | 'messages',
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: { new: Record<string, unknown>; old: Record<string, unknown> }) => void
) {
  const channel = (supabase.channel as any)(`public:${table}`)
    .on(
      'postgres_changes',
      { event, schema: 'public', table },
      callback
    )
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(channel),
  };
}
