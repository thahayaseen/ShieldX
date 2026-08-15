-- ============================================================
-- A.E.G.I.S. – Migration 8: Add FCM Token to Heroes
-- ============================================================

ALTER TABLE public.heroes ADD COLUMN fcm_token TEXT;
