-- ============================================================
-- A.E.G.I.S. – Migration 2: Row Level Security (RLS)
-- ============================================================

-- ─── Enable RLS on all tables ────────────────────────────────
ALTER TABLE heroes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HEROES
-- ============================================================

-- Anyone (even unauthenticated) can read hero profiles
CREATE POLICY "heroes_select_public"
  ON heroes FOR SELECT
  USING (true);

-- Only authenticated users can insert heroes
-- (In production this would be restricted to admins)
CREATE POLICY "heroes_insert_authenticated"
  ON heroes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- A hero can update their own record; service_role can update any
CREATE POLICY "heroes_update_own"
  ON heroes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Only service_role (backend / admin) can delete heroes
CREATE POLICY "heroes_delete_service_role"
  ON heroes FOR DELETE
  TO service_role
  USING (true);

-- ============================================================
-- MISSIONS
-- ============================================================

-- Anyone can read missions (heroes need full visibility)
CREATE POLICY "missions_select_public"
  ON missions FOR SELECT
  USING (true);

-- Authenticated users (command center / API) can create missions
CREATE POLICY "missions_insert_authenticated"
  ON missions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update missions
CREATE POLICY "missions_update_authenticated"
  ON missions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only service_role can delete missions
CREATE POLICY "missions_delete_service_role"
  ON missions FOR DELETE
  TO service_role
  USING (true);

-- ============================================================
-- INCIDENTS
-- ============================================================

-- Anyone can read incidents
CREATE POLICY "incidents_select_public"
  ON incidents FOR SELECT
  USING (true);

-- Authenticated users can report incidents
CREATE POLICY "incidents_insert_authenticated"
  ON incidents FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update incident status
CREATE POLICY "incidents_update_authenticated"
  ON incidents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only service_role can delete incidents
CREATE POLICY "incidents_delete_service_role"
  ON incidents FOR DELETE
  TO service_role
  USING (true);

-- ============================================================
-- MESSAGES
-- ============================================================

-- Authenticated users can read all messages
CREATE POLICY "messages_select_authenticated"
  ON messages FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can send messages
CREATE POLICY "messages_insert_authenticated"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Service role can manage messages (system alerts)
CREATE POLICY "messages_manage_service_role"
  ON messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- GRANT table access to Supabase roles
-- ============================================================
GRANT SELECT ON heroes, missions, incidents TO anon;
GRANT ALL    ON heroes, missions, incidents, messages TO authenticated;
GRANT ALL    ON heroes, missions, incidents, messages TO service_role;
