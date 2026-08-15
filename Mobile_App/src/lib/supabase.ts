import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { HeroStatus, MissionStatus, Mission, Priority } from '@/types';

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
  status: MissionStatus,
  heroId?: string
): Promise<void> {
  const dbStatusMap: Record<MissionStatus, string> = {
    pending: 'pending',
    dispatched: 'dispatched',
    accepted: 'accepted',
    en_route: 'en_route',
    arrived: 'arrived',
    complete: 'completed',
    failed: 'failed',
  };

  const dbStatus = dbStatusMap[status] ?? status;

  const updatePayload: Record<string, any> = {
    status: dbStatus,
    updated_at: new Date().toISOString(),
  };

  if (heroId) {
    updatePayload.assigned_hero_id = heroId;
  }

  const { error } = await supabase
    .from('missions')
    .update(updatePayload)
    .eq('id', missionId);

  if (error) {
    console.error('[AEGIS Supabase] Failed to update mission status:', error.message);
  }
}

export function formatSupabaseMission(dbMission: any): Mission {
  const priorityMap: Record<string, Priority> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'critical',
  };

  const statusMap: Record<string, MissionStatus> = {
    pending: 'pending',
    dispatched: 'pending',
    accepted: 'accepted',
    en_route: 'en_route',
    arrived: 'arrived',
    in_progress: 'en_route',
    completed: 'complete',
    complete: 'complete',
    failed: 'failed',
  };

  return {
    id: dbMission.id,
    title: dbMission.title || 'Untitled Emergency',
    description: dbMission.description || '',
    priority: priorityMap[dbMission.priority] || 'medium',
    status: statusMap[dbMission.status] || 'pending',
    location: dbMission.location
      ? {
          lat: dbMission.location.lat ?? 11.2588,
          lng: dbMission.location.lng ?? 75.7804,
          label: dbMission.location.city || dbMission.location.address || dbMission.location.label || 'Calicut Sector',
        }
      : { lat: 11.2588, lng: 75.7804, label: 'Calicut Sector' },
    requiredPowers: Array.isArray(dbMission.required_powers) ? dbMission.required_powers : [],
    assignedHeroId: dbMission.assigned_hero_id,
    incidentId: dbMission.incident_id,
    aiReasoning: dbMission.ai_reasoning,
    createdAt: dbMission.created_at || new Date().toISOString(),
    updatedAt: dbMission.updated_at || new Date().toISOString(),
  };
}

/** Fetch all live missions directly from Supabase DB */
export async function fetchMissionsFromSupabase(): Promise<Mission[]> {
  try {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[AEGIS Supabase] Fetch missions error:', error);
      return [];
    }

    return data.map(formatSupabaseMission);
  } catch (err) {
    console.error('[AEGIS Supabase] fetchMissions error:', err);
    return [];
  }
}

/** Update Hero FCM token directly in Supabase DB */
export async function updateHeroFcmTokenInSupabase(
  heroId: string,
  fcmToken: string
): Promise<void> {
  const { error } = await supabase
    .from('heroes')
    .update({ fcm_token: fcmToken, updated_at: new Date().toISOString() })
    .eq('id', heroId);

  if (error) {
    console.error('[AEGIS Supabase] Failed to update FCM token:', error.message);
  } else {
    console.log('[AEGIS Supabase] Registered FCM token for hero:', heroId);
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
  const uniqueChannelName = `public:${table}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const channel = (supabase.channel as any)(uniqueChannelName)
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
