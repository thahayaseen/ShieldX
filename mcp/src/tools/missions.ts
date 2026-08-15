import { supabase } from '../database/supabase.js';

// Define the push notification helper
async function sendPushNotification(fcmToken: string, title: string, body: string) {
  const fcmServerKey = process.env.FCM_SERVER_KEY;
  if (!fcmServerKey) {
    console.warn("⚠️ FCM_SERVER_KEY is not set in .env! Push notification skipped.");
    console.log(`[MOCK PUSH] To: ${fcmToken} | Title: ${title} | Body: ${body}`);
    return;
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmServerKey}`
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: {
          title: title,
          body: body,
          sound: "default"
        }
      })
    });

    if (!response.ok) {
      console.error("Failed to send FCM push notification:", await response.text());
    } else {
      console.log(`Push notification sent successfully to token: ${fcmToken}`);
    }
  } catch (err) {
    console.error("Error sending push notification:", err);
  }
}

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

export async function createMission(
  title: string, 
  description: string, 
  priority: string, 
  assignedHeroId?: string
) {
  // 1. Create the new mission
  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .insert({
      title,
      description,
      priority: priority.toLowerCase(),
      status: assignedHeroId ? 'dispatched' : 'pending',
      assigned_hero_id: assignedHeroId || null
    })
    .select()
    .single();

  if (missionError) {
    throw new Error(`Failed to create mission: ${missionError.message}`);
  }

  // 2. If a hero is assigned, fetch their FCM token and send a push notification
  if (assignedHeroId) {
    const { data: hero, error: heroError } = await supabase
      .from('heroes')
      .select('name, fcm_token')
      .eq('id', assignedHeroId)
      .single();

    if (heroError) {
      console.error(`Failed to fetch hero details for push notification: ${heroError.message}`);
    } else if (hero?.fcm_token) {
      // Send the actual push notification
      await sendPushNotification(
        hero.fcm_token,
        "🚨 New Mission Dispatched!",
        `Priority: ${priority.toUpperCase()} - ${title}`
import { supabase } from '../database/supabase.js';

// Define the push notification helper
async function sendPushNotification(fcmToken: string, title: string, body: string) {
  const fcmServerKey = process.env.FCM_SERVER_KEY;
  if (!fcmServerKey) {
    console.warn("⚠️ FCM_SERVER_KEY is not set in .env! Push notification skipped.");
    console.log(`[MOCK PUSH] To: ${fcmToken} | Title: ${title} | Body: ${body}`);
    return;
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmServerKey}`
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: {
          title: title,
          body: body,
          sound: "default"
        }
      })
    });

    if (!response.ok) {
      console.error("Failed to send FCM push notification:", await response.text());
    } else {
      console.log(`Push notification sent successfully to token: ${fcmToken}`);
    }
  } catch (err) {
    console.error("Error sending push notification:", err);
  }
}

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

export async function createMission(
  title: string, 
  description: string, 
  priority: string, 
  assignedHeroId?: string
) {
  // 1. Create the new mission
  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .insert({
      title,
      description,
      priority: priority.toLowerCase(),
      status: assignedHeroId ? 'dispatched' : 'pending',
      assigned_hero_id: assignedHeroId || null
    })
    .select()
    .single();

  if (missionError) {
    throw new Error(`Failed to create mission: ${missionError.message}`);
  }

  // 2. If a hero is assigned, fetch their FCM token and send a push notification
  if (assignedHeroId) {
    const { data: hero, error: heroError } = await supabase
      .from('heroes')
      .select('name, fcm_token')
      .eq('id', assignedHeroId)
      .single();

    if (heroError) {
      console.error(`Failed to fetch hero details for push notification: ${heroError.message}`);
    } else if (hero?.fcm_token) {
      // Send the actual push notification
      await sendPushNotification(
        hero.fcm_token,
        "🚨 New Mission Dispatched!",
        `Priority: ${priority.toUpperCase()} - ${title}`
      );
    } else {
      console.log(`Hero ${hero?.name} does not have an FCM token registered.`);
    }
  }

  return mission;
}

export async function assignMission(missionId: string, heroId: string) {
  // 1. Assign the hero to the mission
  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .update({
      assigned_hero_id: heroId,
      status: 'dispatched',
      updated_at: new Date().toISOString()
    })
    .eq('id', missionId)
    .select('*, heroes!missions_assigned_hero_id_fkey(name, fcm_token)')
    .single();

  if (missionError) {
    throw new Error(`Failed to assign mission: ${missionError.message}`);
  }

  // 2. Send push notification if hero has FCM token
  const heroName = mission.heroes?.name || 'Hero';
  const fcmToken = mission.heroes?.fcm_token;

  if (fcmToken) {
    await sendPushNotification(
      fcmToken,
      "🚨 New Mission Assignment!",
      `You have been dispatched to: ${mission.title}`
    );
  } else {
    console.log(`Hero ${heroName} does not have an FCM token registered.`);
  }

  return { success: true, mission, message: `Successfully assigned ${heroName} to mission ${mission.title}.` };
}
