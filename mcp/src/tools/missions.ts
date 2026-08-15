import { supabase } from '../database/supabase.js';

export async function getActiveMissions(priority?: string) {
  let query = supabase.from('missions').select(`
    *,
    heroes (
      name,
      codename,
      status
    )
  `).in('status', ['pending', 'in_progress']);
  
  if (priority) {
    query = query.eq('priority', priority.toLowerCase());
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch active missions: ${error.message}`);
  }
  
  return data;
}

export async function getHeroAssignment(missionId?: string) {
  if (!missionId) {
    return getActiveMissions();
  }
  
  const { data, error } = await supabase
    .from('missions')
    .select(`
      *,
      heroes (*)
    `)
    .eq('id', missionId)
    .single();
    
  if (error) {
    throw new Error(`Failed to fetch hero assignment: ${error.message}`);
  }
  
  return data;
}
