-- ============================================================
-- A.E.G.I.S. – Migration 3: Helper Functions & Views
-- ============================================================

-- ─── get_available_heroes() ──────────────────────────────────
-- Returns heroes that are currently available for mission assignment.
CREATE OR REPLACE FUNCTION get_available_heroes()
RETURNS SETOF heroes
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT * FROM heroes WHERE status = 'available' ORDER BY name;
$$;

-- ─── get_breaking_incidents(minutes) ─────────────────────────
-- Returns incidents reported within the last N minutes.
CREATE OR REPLACE FUNCTION get_breaking_incidents(minutes INT DEFAULT 30)
RETURNS SETOF incidents
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT *
  FROM incidents
  WHERE
    status NOT IN ('resolved', 'closed')
    AND created_at >= NOW() - (minutes || ' minutes')::INTERVAL
  ORDER BY
    CASE severity
      WHEN 'critical' THEN 1
      WHEN 'high'     THEN 2
      WHEN 'medium'   THEN 3
      ELSE 4
    END,
    created_at DESC;
$$;

-- ─── update_hero_status() ────────────────────────────────────
-- Atomically updates a hero's status and bumps updated_at.
-- Called by the wristband endpoint and the backend dispatch service.
CREATE OR REPLACE FUNCTION update_hero_status(
  hero_id    UUID,
  new_status hero_status
)
RETURNS heroes
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  updated_hero heroes;
BEGIN
  UPDATE heroes
  SET    status = new_status,
         updated_at = NOW()
  WHERE  id = hero_id
  RETURNING * INTO updated_hero;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hero % not found', hero_id;
  END IF;

  RETURN updated_hero;
END;
$$;

-- ─── assign_hero_to_mission() ────────────────────────────────
-- Assigns a hero to a mission and marks the hero as on_mission atomically.
CREATE OR REPLACE FUNCTION assign_hero_to_mission(
  p_mission_id UUID,
  p_hero_id    UUID,
  p_reasoning  TEXT DEFAULT NULL
)
RETURNS missions
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  updated_mission missions;
BEGIN
  -- Verify the hero is available
  IF NOT EXISTS (
    SELECT 1 FROM heroes WHERE id = p_hero_id AND status = 'available'
  ) THEN
    RAISE EXCEPTION 'Hero % is not available for assignment', p_hero_id;
  END IF;

  -- Update the mission
  UPDATE missions
  SET    assigned_hero_id = p_hero_id,
         status           = 'dispatched',
         ai_reasoning     = p_reasoning,
         updated_at       = NOW()
  WHERE  id = p_mission_id
  RETURNING * INTO updated_mission;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission % not found', p_mission_id;
  END IF;

  -- Mark hero as on_mission
  UPDATE heroes
  SET    status     = 'on_mission',
         updated_at = NOW()
  WHERE  id = p_hero_id;

  RETURN updated_mission;
END;
$$;

-- ─── complete_mission() ──────────────────────────────────────
-- Marks mission as completed and frees up the hero.
CREATE OR REPLACE FUNCTION complete_mission(p_mission_id UUID)
RETURNS missions
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  updated_mission missions;
  v_hero_id       UUID;
BEGIN
  SELECT assigned_hero_id INTO v_hero_id
  FROM missions WHERE id = p_mission_id;

  UPDATE missions
  SET    status     = 'completed',
         updated_at = NOW()
  WHERE  id = p_mission_id
  RETURNING * INTO updated_mission;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission % not found', p_mission_id;
  END IF;

  -- Free the hero if one was assigned
  IF v_hero_id IS NOT NULL THEN
    UPDATE heroes
    SET    status     = 'available',
           updated_at = NOW()
    WHERE  id = v_hero_id;
  END IF;

  RETURN updated_mission;
END;
$$;

-- ─── Views ───────────────────────────────────────────────────

-- Active missions with hero and incident details joined
CREATE OR REPLACE VIEW active_missions_view AS
SELECT
  m.id,
  m.title,
  m.description,
  m.location,
  m.priority,
  m.status,
  m.required_powers,
  m.ai_reasoning,
  m.eta_minutes,
  m.created_at,
  m.updated_at,
  -- Hero details
  jsonb_build_object(
    'id',         h.id,
    'name',       h.name,
    'codename',   h.codename,
    'avatar_url', h.avatar_url,
    'status',     h.status
  ) AS hero,
  -- Incident details
  jsonb_build_object(
    'id',          i.id,
    'title',       i.title,
    'severity',    i.severity,
    'status',      i.status
  ) AS incident
FROM missions m
LEFT JOIN heroes h    ON h.id = m.assigned_hero_id
LEFT JOIN incidents i ON i.id = m.incident_id
WHERE m.status NOT IN ('completed', 'failed', 'cancelled');

GRANT SELECT ON active_missions_view TO anon, authenticated;

-- System overview snapshot
CREATE OR REPLACE VIEW system_overview AS
SELECT
  (SELECT COUNT(*) FROM heroes WHERE status = 'available')  AS heroes_available,
  (SELECT COUNT(*) FROM heroes WHERE status = 'on_mission') AS heroes_on_mission,
  (SELECT COUNT(*) FROM heroes WHERE status = 'offline')    AS heroes_offline,
  (SELECT COUNT(*) FROM heroes WHERE status = 'injured')    AS heroes_injured,
  (SELECT COUNT(*) FROM missions
   WHERE status NOT IN ('completed', 'failed', 'cancelled'))AS active_missions,
  (SELECT COUNT(*) FROM incidents
   WHERE status NOT IN ('resolved', 'closed'))              AS open_incidents,
  (SELECT COUNT(*) FROM incidents
   WHERE severity = 'critical'
     AND status NOT IN ('resolved', 'closed'))              AS critical_incidents;

GRANT SELECT ON system_overview TO anon, authenticated;
