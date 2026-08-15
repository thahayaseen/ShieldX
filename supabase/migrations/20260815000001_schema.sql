-- ============================================================
-- A.E.G.I.S. – Migration 1: Schema
-- ============================================================

-- ─── Enums ───────────────────────────────────────────────────
CREATE TYPE hero_status AS ENUM (
  'available',
  'on_mission',
  'offline',
  'injured'
);

CREATE TYPE mission_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE mission_status AS ENUM (
  'pending',
  'dispatched',
  'accepted',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE incident_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE incident_status AS ENUM (
  'reported',
  'under_review',
  'dispatched',
  'resolved',
  'closed'
);

CREATE TYPE message_type AS ENUM (
  'text',
  'voice',
  'system',
  'alert'
);

-- ─── Heroes ──────────────────────────────────────────────────
CREATE TABLE heroes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  codename      VARCHAR(100) NOT NULL UNIQUE,
  powers        TEXT[]       NOT NULL DEFAULT '{}',
  status        hero_status  NOT NULL DEFAULT 'offline',
  location      JSONB,          -- { "city": "...", "lat": 0.0, "lng": 0.0 }
  avatar_url    TEXT,
  bio           TEXT,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_heroes_status    ON heroes(status);
CREATE INDEX idx_heroes_user_id   ON heroes(user_id);
CREATE INDEX idx_heroes_codename  ON heroes(codename);

-- ─── Missions ────────────────────────────────────────────────
CREATE TABLE missions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            VARCHAR(200)     NOT NULL,
  description      TEXT,
  location         JSONB,           -- { "city": "...", "address": "...", "lat": 0.0, "lng": 0.0 }
  priority         mission_priority NOT NULL DEFAULT 'medium',
  status           mission_status   NOT NULL DEFAULT 'pending',
  required_powers  TEXT[]           NOT NULL DEFAULT '{}',
  assigned_hero_id UUID             REFERENCES heroes(id) ON DELETE SET NULL,
  incident_id      UUID,            -- filled after incidents table is created
  ai_reasoning     TEXT,            -- AI explanation of hero selection
  eta_minutes      INT,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_missions_status           ON missions(status);
CREATE INDEX idx_missions_priority         ON missions(priority);
CREATE INDEX idx_missions_assigned_hero_id ON missions(assigned_hero_id);

-- ─── Incidents ───────────────────────────────────────────────
CREATE TABLE incidents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(200)     NOT NULL,
  description TEXT,
  severity    incident_severity NOT NULL DEFAULT 'medium',
  location    JSONB,
  status      incident_status  NOT NULL DEFAULT 'reported',
  mission_id  UUID             REFERENCES missions(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_status   ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_created  ON incidents(created_at DESC);

-- Add the cross-reference FK now that both tables exist
ALTER TABLE missions
  ADD CONSTRAINT fk_missions_incident
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE SET NULL;

-- ─── Messages ────────────────────────────────────────────────
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID          REFERENCES heroes(id) ON DELETE SET NULL,
  content      TEXT          NOT NULL,
  message_type message_type  NOT NULL DEFAULT 'text',
  mission_id   UUID          REFERENCES missions(id) ON DELETE CASCADE,
  is_read      BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_mission_id ON messages(mission_id);
CREATE INDEX idx_messages_sender_id  ON messages(sender_id);
CREATE INDEX idx_messages_created    ON messages(created_at DESC);

-- ─── Auto-update updated_at ──────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_heroes_updated_at
  BEFORE UPDATE ON heroes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_missions_updated_at
  BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
