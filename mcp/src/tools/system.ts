import { supabase } from '../database/supabase.js';

export async function getSystemOverview() {
  const [heroesRes, missionsRes, incidentsRes] = await Promise.all([
    supabase.from('heroes').select('status', { count: 'exact' }),
    supabase.from('missions').select('status', { count: 'exact' }).in('status', ['pending', 'in_progress']),
    supabase.from('incidents').select('status', { count: 'exact' }).in('status', ['reported', 'in_progress'])
  ]);

  const heroesByStatus = heroesRes.data?.reduce((acc: any, hero: any) => {
    acc[hero.status] = (acc[hero.status] || 0) + 1;
    return acc;
  }, {});

  return {
    totalHeroesOnline: heroesByStatus?.online || 0,
    totalHeroesBusy: (heroesByStatus?.busy || 0) + (heroesByStatus?.mission_active || 0),
    activeMissionsCount: missionsRes.data?.length || 0,
    activeIncidentsCount: incidentsRes.data?.length || 0,
    timestamp: new Date().toISOString()
  };
}
