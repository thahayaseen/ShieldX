import { supabase } from '../database/supabase.js';

export async function getBreakingIncidents(timeRangeMinutes: number = 60) {
  const timeThreshold = new Date();
  timeThreshold.setMinutes(timeThreshold.getMinutes() - timeRangeMinutes);
  
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .gte('created_at', timeThreshold.toISOString())
    .order('created_at', { ascending: false });
    
  if (error) {
    throw new Error(`Failed to fetch breaking incidents: ${error.message}`);
  }
  
  return data;
}
