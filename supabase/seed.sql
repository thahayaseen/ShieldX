-- ============================================================
-- A.E.G.I.S. – Seed Data
-- ============================================================
-- Run via: supabase db reset
-- Or:      supabase db seed
-- ============================================================

-- ─── Heroes ──────────────────────────────────────────────────
INSERT INTO heroes (id, name, codename, powers, status, location, avatar_url, bio) VALUES

  (
    '11111111-0000-0000-0000-000000000001',
    'Peter Parker',
    'Spider-Man',
    ARRAY['wall-crawling','web-slinging','super-strength','spider-sense','agility','rescue'],
    'available',
    '{"city": "New York", "lat": 40.7128, "lng": -74.0060}',
    'https://i.ibb.co/vJ3x9YZ/spiderman.png',
    'Your friendly neighborhood Spider-Man. Expert at urban rescue and rapid response.'
  ),

  (
    '22222222-0000-0000-0000-000000000002',
    'Thor Odinson',
    'Thor',
    ARRAY['lightning','flight','super-strength','mjolnir','weather-control','durability'],
    'on_mission',
    '{"city": "Asgard", "lat": 59.9139, "lng": 10.7522}',
    'https://i.ibb.co/Lpwt1vY/thor.png',
    'God of Thunder and Prince of Asgard. Unmatched in energy-based threats.'
  ),

  (
    '33333333-0000-0000-0000-000000000003',
    'Tony Stark',
    'Iron Man',
    ARRAY['flight','repulsor-beams','armor','genius-intellect','weapons','hacking'],
    'available',
    '{"city": "Malibu", "lat": 34.0259, "lng": -118.7798}',
    'https://i.ibb.co/5kZ4sVb/ironman.png',
    'Genius, billionaire, playboy, philanthropist. High-tech combat specialist.'
  ),

  (
    '44444444-0000-0000-0000-000000000004',
    'Bruce Banner',
    'Hulk',
    ARRAY['super-strength','durability','regeneration','rage-amplification','rescue','demolition'],
    'available',
    '{"city": "New York", "lat": 40.7128, "lng": -74.0060}',
    'https://i.ibb.co/k4g7kMr/hulk.png',
    'The strongest there is. Ideal for structural rescues, demolition, and brute force scenarios.'
  ),

  (
    '55555555-0000-0000-0000-000000000005',
    'Steve Rogers',
    'Captain America',
    ARRAY['super-strength','agility','shield','tactics','leadership','rescue','endurance'],
    'available',
    '{"city": "Brooklyn", "lat": 40.6782, "lng": -73.9442}',
    'https://i.ibb.co/QrMXBCM/captain-america.png',
    'First Avenger and tactical leader. Expert in hostage situations and ground combat.'
  ),

  (
    '66666666-0000-0000-0000-000000000006',
    'Natasha Romanoff',
    'Black Widow',
    ARRAY['espionage','martial-arts','hacking','stealth','interrogation','gadgets'],
    'available',
    '{"city": "Washington DC", "lat": 38.9072, "lng": -77.0369}',
    'https://i.ibb.co/JskjX5k/blackwidow.png',
    'World''s greatest spy. Specialist in covert ops, infiltration, and intelligence gathering.'
  ),

  (
    '77777777-0000-0000-0000-000000000007',
    'Stephen Strange',
    'Doctor Strange',
    ARRAY['magic','teleportation','time-manipulation','shields','astral-projection','portals'],
    'available',
    '{"city": "New York", "lat": 40.7128, "lng": -74.0060}',
    'https://i.ibb.co/kQvzLyj/drstrange.png',
    'Sorcerer Supreme. Master of the mystic arts — best against supernatural and dimensional threats.'
  ),

  (
    '88888888-0000-0000-0000-000000000008',
    'Vision',
    'Vision',
    ARRAY['density-control','mind-stone','flight','phasing','energy-beams','super-strength'],
    'offline',
    '{"city": "Wakanda", "lat": -8.7832, "lng": 34.5085}',
    'https://i.ibb.co/m4W23yz/vision.png',
    'Synthezoid Avenger powered by the Mind Stone. Currently in standby mode.'
  );

-- ─── Incidents ───────────────────────────────────────────────
INSERT INTO incidents (id, title, description, severity, location, status) VALUES

  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Building Collapse – Calicut',
    '5-story commercial building collapsed near SM Street, Kozhikode. Multiple people trapped under debris. Structural damage severe. Emergency services overwhelmed.',
    'critical',
    '{"city": "Calicut", "address": "SM Street, Kozhikode, Kerala", "lat": 11.2588, "lng": 75.7804}',
    'dispatched'
  ),

  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'Energy Anomaly – New York',
    'Unknown energy signature detected above Midtown Manhattan. Portal-like disturbance observed. Civilians evacuating. Possible dimensional breach.',
    'high',
    '{"city": "New York", "address": "Midtown Manhattan, NY", "lat": 40.7549, "lng": -73.9840}',
    'reported'
  ),

  (
    'cccccccc-0000-0000-0000-000000000003',
    'Hostage Situation – Washington DC',
    'Armed group has taken control of the National Museum. 47 hostages confirmed. Negotiators on standby. Tactical unit requested.',
    'high',
    '{"city": "Washington DC", "address": "National Mall, Washington DC", "lat": 38.8895, "lng": -77.0353}',
    'under_review'
  );

-- ─── Missions ────────────────────────────────────────────────
INSERT INTO missions (id, title, description, location, priority, status, required_powers, assigned_hero_id, incident_id, ai_reasoning, eta_minutes) VALUES

  (
    'dddddddd-0000-0000-0000-000000000001',
    'Operation: Rescue Calicut',
    'Respond to multi-story building collapse in Kozhikode. Extract survivors from debris and stabilize the structure.',
    '{"city": "Calicut", "address": "SM Street, Kozhikode, Kerala", "lat": 11.2588, "lng": 75.7804}',
    'critical',
    'dispatched',
    ARRAY['super-strength','durability','rescue'],
    '44444444-0000-0000-0000-000000000004',  -- Hulk
    'aaaaaaaa-0000-0000-0000-000000000001',
    'HULK selected: Matches required powers (super-strength, durability, rescue). Only available hero with sufficient structural manipulation capability. Confidence: 97%.',
    12
  ),

  (
    'eeeeeeee-0000-0000-0000-000000000002',
    'Operation: Thunder Watch',
    'Monitor and investigate the energy anomaly in Midtown Manhattan. Neutralize dimensional threat if confirmed.',
    '{"city": "New York", "address": "Midtown Manhattan, NY", "lat": 40.7549, "lng": -73.9840}',
    'high',
    'accepted',
    ARRAY['lightning','energy-beams','flight','durability'],
    '22222222-0000-0000-0000-000000000002',  -- Thor
    'bbbbbbbb-0000-0000-0000-000000000002',
    'THOR selected: Energy anomaly matches lightning/energy profile. Previous experience with Bifrost and dimensional threats. Confidence: 94%.',
    8
  );

-- ─── Messages ────────────────────────────────────────────────
INSERT INTO messages (sender_id, content, message_type, mission_id) VALUES

  (
    '44444444-0000-0000-0000-000000000004',
    'Command Center, Hulk is on the way. ETA 12 minutes. HULK SMASH RUBBLE.',
    'text',
    'dddddddd-0000-0000-0000-000000000001'
  ),

  (
    '22222222-0000-0000-0000-000000000002',
    'Thor here. I have arrived at the anomaly site. The energy signature is unlike anything from Asgard. Proceeding with caution.',
    'text',
    'eeeeeeee-0000-0000-0000-000000000002'
  ),

  (
    NULL,
    'AEGIS ALERT: Mission dispatched. Hulk assigned to building collapse in Calicut. All units stand by.',
    'system',
    'dddddddd-0000-0000-0000-000000000001'
  );

-- ─── Update Hulk status to on_mission (already dispatched) ───
UPDATE heroes SET status = 'on_mission' WHERE codename = 'Hulk';
