import { supabase } from '../database/supabase.js';

export async function getHeroStatus(heroName?: string) {
  let query = supabase.from('heroes').select('*');
  
  if (heroName) {
    query = query.ilike('name', `%${heroName}%`);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch hero status: ${error.message}`);
  }
  
  return data;
}

export async function getAvailableHeroes() {
  const { data, error } = await supabase
    .from('heroes')
    .select('*')
    .eq('status', 'online');
    
  if (error) {
    throw new Error(`Failed to fetch available heroes: ${error.message}`);
  }
  
  return data;
}
