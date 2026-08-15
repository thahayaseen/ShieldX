// A.E.G.I.S. – Supabase Client & Realtime Helpers (web-app)
import { createClient } from '@supabase/supabase-js';
import type { Hero, HeroStatus, Mission, MissionStatus, Priority } from '../types';

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

export function formatDbMission(dbMission: any): Mission {
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
 * Fetch all missions directly from live Supabase database
 */
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

    return data.map(formatDbMission);
  } catch (err) {
    console.error('[AEGIS Supabase] fetchMissions error:', err);
    return [];
  }
}

/**
 * Create & dispatch a new mission directly into Supabase database.
 * Broadcasts via Supabase Realtime so the mobile hero app instantly vibrates & beeps!
 */
export async function createMissionInSupabase(mission: Partial<Mission>): Promise<Mission | null> {
  try {
    const insertObj: Record<string, any> = {
      title: mission.title || 'NEW TACTICAL MISSION',
      description: mission.description || '',
      location: mission.location || { city: 'Calicut', lat: 11.2588, lng: 75.7804 },
      priority: mission.priority || 'medium',
      status: 'dispatched',
      required_powers: mission.requiredPowers || [],
      assigned_hero_id: mission.assignedHeroId,
      ai_reasoning: mission.aiReasoning || 'Dispatched via A.E.G.I.S. Command Center',
    };

    const { data, error } = await supabase
      .from('missions')
      .insert(insertObj)
      .select('*')
      .single();

    if (error) {
      console.error('[AEGIS Supabase] Create mission error:', error.message);
      return null;
    }

    return formatDbMission(data);
  } catch (err) {
    console.error('[AEGIS Supabase] createMission error:', err);
    return null;
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

/**
 * Realtime WebSocket listener for live postgres_changes on table missions
 */
export function subscribeToMissionsRealtime(onMissionsChanged: (payload: any) => void) {
  const channel = supabase
    .channel('realtime:missions:dashboard')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'missions' },
      (payload) => {
        console.log('[AEGIS Realtime WebSocket] Received missions change:', payload);
        onMissionsChanged(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
