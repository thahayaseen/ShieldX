// A.E.G.I.S. – Supabase Client & Realtime Helpers (web-app)
import { createClient } from '@supabase/supabase-js';
import type { Hero, HeroStatus } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BRAND_COLORS: Record<string, string> = {
  'spider-man': '#e53935',
  'spider man': '#e53935',
  'hulk': '#2e7d32',
  'thor': '#1565c0',
  'iron man': '#ff8f00',
  'captain america': '#0277bd',
  'black widow': '#c62828',
  'doctor strange': '#7b1fa2',
  'vision': '#00838f',
};

export function formatDbHero(dbHero: any): Hero {
  const statusMap: Record<string, HeroStatus> = {
    available: 'online',
    online: 'online',
    busy: 'busy',
    injured: 'busy',
    on_mission: 'on_mission',
    offline: 'offline',
  };

  const code = (dbHero.codename || 'Unknown').toLowerCase();
  const brandColor = dbHero.brand_color || BRAND_COLORS[code] || '#00d4ff';

  return {
    id: dbHero.id,
    name: dbHero.name || 'Unknown Hero',
    codename: dbHero.codename || 'Agent_Pending',
    powers: Array.isArray(dbHero.powers) ? dbHero.powers : [],
    status: statusMap[dbHero.status] || 'offline',
    location: dbHero.location
      ? {
          lat: dbHero.location.lat ?? 11.2588,
          lng: dbHero.location.lng ?? 75.7804,
          label: dbHero.location.city || dbHero.location.label || 'Sector Unspecified',
        }
      : null,
    avatarUrl: dbHero.avatar_url,
    brandColor,
    createdAt: dbHero.created_at || new Date().toISOString(),
    updatedAt: dbHero.updated_at || new Date().toISOString(),
  };
}

/**
 * Fetch all heroes directly from live Supabase database
 */
export async function fetchHeroesFromSupabase(): Promise<Hero[]> {
  try {
    const { data, error } = await supabase
      .from('heroes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[AEGIS Supabase] Fetch heroes error:', error);
      return [];
    }

    return data.map(formatDbHero);
  } catch (err) {
    console.error('[AEGIS Supabase] fetchHeroes error:', err);
    return [];
  }
}

/**
 * Approve & update a hero record in Supabase database.
 * Tries RPC `admin_update_hero` first (bypasses RLS), then falls back to direct table update.
 */
export async function updateHeroInSupabase(
  heroId: string,
  payload: {
    name?: string;
    codename?: string;
    powers?: string[];
    status?: HeroStatus;
    bio?: string;
    locationLabel?: string;
  }
): Promise<boolean> {
  try {
    const dbStatusMap: Record<HeroStatus, string> = {
      online: 'available',
      on_mission: 'on_mission',
      busy: 'injured',
      offline: 'offline',
    };

    const locationObj = payload.locationLabel
      ? { city: payload.locationLabel, lat: 11.2588, lng: 75.7804 }
      : undefined;

    // 1. Try calling the RPC function (bypasses RLS restriction)
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_hero', {
      p_hero_id: heroId,
      p_name: payload.name,
      p_codename: payload.codename,
      p_powers: payload.powers,
      p_location: locationObj,
    });

    if (!rpcError && rpcData?.success) {
      return true;
    }

    // 2. Fallback to direct table update
    const updateObj: Record<string, any> = {};
    if (payload.name !== undefined) updateObj.name = payload.name;
    if (payload.codename !== undefined) updateObj.codename = payload.codename;
    if (payload.powers !== undefined) updateObj.powers = payload.powers;
    if (payload.status !== undefined) updateObj.status = dbStatusMap[payload.status];
    if (payload.bio !== undefined) updateObj.bio = payload.bio;
    if (locationObj) updateObj.location = locationObj;

    const { error } = await supabase.from('heroes').update(updateObj).eq('id', heroId);

    if (error) {
      console.error('[AEGIS Supabase] Update hero failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[AEGIS Supabase] updateHero error:', err);
    return false;
  }
}

/**
 * Realtime WebSocket listener for live postgres_changes on table heroes
 */
export function subscribeToHeroesRealtime(onHeroesChanged: (payload: any) => void) {
  const channel = supabase
    .channel('realtime:heroes:dashboard')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'heroes' },
      (payload) => {
        console.log('[AEGIS Realtime WebSocket] Received heroes change:', payload);
        onHeroesChanged(payload);
      }
    )
    .subscribe((status) => {
      console.log('[AEGIS Realtime WebSocket] Heroes subscription status:', status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
