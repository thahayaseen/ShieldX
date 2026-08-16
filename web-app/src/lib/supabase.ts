// A.E.G.I.S. – Supabase Client & Realtime Helpers (web-app)
import { createClient } from '@supabase/supabase-js';
import type { Hero, HeroStatus, Mission, MissionStatus, Priority, Incident } from '../types';

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
    assignedHero: dbMission.assigned_hero ? formatDbHero(dbMission.assigned_hero) : undefined,
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
      .select('*, assigned_hero:heroes(*)')
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
 * Fetch all emergency incidents directly from live Supabase database
 */
export async function fetchIncidentsFromSupabase(): Promise<Incident[]> {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((inc: any) => ({
      id: inc.id,
      title: inc.title || 'Emergency Incident',
      description: inc.description || '',
      severity: inc.severity || 'critical',
      location: inc.location
        ? {
            lat: inc.location.lat ?? 11.2588,
            lng: inc.location.lng ?? 75.7804,
            label: inc.location.label || inc.location.city || 'Calicut Sector',
          }
        : { lat: 11.2588, lng: 75.7804, label: 'Calicut Sector' },
      status: inc.status || 'reported',
      createdAt: inc.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[AEGIS Supabase] fetchIncidents error:', err);
    return [];
  }
}

/**
 * Report a new emergency incident to Supabase database.
 */
export async function reportIncidentToSupabase(inc: Partial<Incident>): Promise<Incident | null> {
  try {
    const insertObj = {
      title: inc.title || 'NEW EMERGENCY INCIDENT',
      description: inc.description || '',
      severity: inc.severity || 'critical',
      location: inc.location || { city: 'Calicut', lat: 11.2588, lng: 75.7804 },
      status: 'reported',
    };

    const { data, error } = await supabase
      .from('incidents')
      .insert(insertObj)
      .select('*')
      .single();

    if (error) {
      console.error('[AEGIS Supabase] Report incident error:', error.message);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      severity: data.severity,
      location: data.location,
      status: data.status,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('[AEGIS Supabase] reportIncident error:', err);
    return null;
  }
}

export async function sendFcmPushNotification(fcmToken: string, title: string, body: string) {
  const fcmServerKey = import.meta.env.VITE_FCM_SERVER_KEY || 'AIzaSyAj_mN-m1kXEfBDN0kgxMkfitkKrVd4cbY';
  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmServerKey}`,
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: {
          title,
          body,
          sound: 'default',
          priority: 'high',
        },
        data: {
          type: 'MISSION_DISPATCH',
          title,
          body,
        },
      }),
    });

    if (response.ok) {
      console.log(`[AEGIS FCM] Push notification dispatched to token: ${fcmToken}`);
    } else {
      console.warn('[AEGIS FCM] Push notification API response:', await response.text());
    }
  } catch (err) {
    console.error('[AEGIS FCM] Error sending FCM push notification:', err);
  }
}

/**
 * Create & dispatch a new mission directly into Supabase database.
 * Automatically links Incident -> Mission -> Hero Status across the entire system.
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
      incident_id: mission.incidentId,
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

    // 1. AUTOMATICALLY CONNECTED: Update linked incident status to 'dispatched'
    if (mission.incidentId) {
      await supabase
        .from('incidents')
        .update({ status: 'dispatched' })
        .eq('id', mission.incidentId);
    }

    // 2. AUTOMATICALLY CONNECTED: Update assigned hero status to 'on_mission'
    if (mission.assignedHeroId) {
      await supabase
        .from('heroes')
        .update({ status: 'on_mission', updated_at: new Date().toISOString() })
        .eq('id', mission.assignedHeroId);

      // 3. Send FCM Push Notification to wristband
      const { data: heroData } = await supabase
        .from('heroes')
        .select('name, codename, fcm_token')
        .eq('id', mission.assignedHeroId)
        .single();

      if (heroData?.fcm_token) {
        await sendFcmPushNotification(
          heroData.fcm_token,
          `🚨 EMERGENCY DISPATCH: ${mission.title?.toUpperCase()}`,
          `Hero ${heroData.codename}, you have been dispatched to an active mission. Respond immediately!`
        );
      }
    }

    return formatDbMission(data);
  } catch (err) {
    console.error('[AEGIS Supabase] createMission error:', err);
    return null;
  }
}

/**
 * Update Mission Status directly in Supabase database.
 * Automatically synchronizes Hero Status & Linked Incident Status when completed!
 */
export async function updateMissionStatusInSupabase(
  missionId: string,
  status: MissionStatus
): Promise<boolean> {
  try {
    const dbStatusMap: Record<string, string> = {
      pending: 'pending',
      dispatched: 'dispatched',
      accepted: 'accepted',
      en_route: 'en_route',
      arrived: 'arrived',
      complete: 'completed',
      failed: 'failed',
    };

    const dbStatus = dbStatusMap[status] || status;

    // Fetch existing mission record to resolve hero_id & incident_id
    const { data: existingMission } = await supabase
      .from('missions')
      .select('id, assigned_hero_id, incident_id')
      .eq('id', missionId)
      .single();

    const { error } = await supabase
      .from('missions')
      .update({ status: dbStatus, updated_at: new Date().toISOString() })
      .eq('id', missionId);

    if (error) {
      console.error('[AEGIS Supabase] Failed to update mission status:', error.message);
      return false;
    }

    // AUTOMATICALLY CONNECTED LIFECYCLE UPDATES
    if (existingMission) {
      const heroId = existingMission.assigned_hero_id;
      const incidentId = existingMission.incident_id;

      if ((status as any) === 'complete' || (status as any) === 'completed') {
        // Mission Completed: Hero becomes Available & Incident becomes Resolved!
        if (heroId) {
          await supabase
            .from('heroes')
            .update({ status: 'available', updated_at: new Date().toISOString() })
            .eq('id', heroId);
        }
        if (incidentId) {
          await supabase
            .from('incidents')
            .update({ status: 'resolved' })
            .eq('id', incidentId);
        }
      } else if (status === 'accepted' || status === 'en_route' || status === 'arrived') {
        // Active Mission: Hero status set to 'on_mission'
        if (heroId) {
          await supabase
            .from('heroes')
            .update({ status: 'on_mission', updated_at: new Date().toISOString() })
            .eq('id', heroId);
        }
      }
    }

    return true;
  } catch (err) {
    console.error('[AEGIS Supabase] updateMissionStatus error:', err);
    return false;
  }
}

/**
 * Approve & update a hero record in Supabase database.
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
        onHeroesChanged(payload);
      }
    )
    .subscribe();

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
        onMissionsChanged(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Realtime WebSocket listener for live postgres_changes on table incidents
 */
export function subscribeToIncidentsRealtime(onIncidentsChanged: (payload: any) => void) {
  const channel = supabase
    .channel('realtime:incidents:dashboard')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'incidents' },
      (payload) => {
        onIncidentsChanged(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
