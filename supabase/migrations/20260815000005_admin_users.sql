-- ============================================================
-- A.E.G.I.S. – Migration 5: Admin Users & Auth Hook
-- ============================================================

-- ─── Admin Users Table ───────────────────────────────────────
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (only admins or service_role can read/write)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (or restrict further if needed)
CREATE POLICY "Admins can view admins" ON public.admin_users
  FOR SELECT USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_users));

-- ─── Supabase Auth Hook: Before Sign-In ──────────────────────
-- This function runs before a user completes sign-in.
-- It checks if their email is in the admin_users table.
CREATE OR REPLACE FUNCTION public.check_is_admin(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_email VARCHAR;
  is_admin BOOLEAN;
BEGIN
  -- Extract email from the event payload
  user_email := event->'user'->>'email';
  
  -- Check if the email exists in our admin_users table
  SELECT EXISTS(
    SELECT 1 FROM public.admin_users WHERE email = user_email
  ) INTO is_admin;
  
  -- If not admin, raise an exception to block login
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Access denied: User is not an authorized administrator.';
  END IF;

  -- If they are an admin, return the event unmodified to allow login
  RETURN event;
END;
$$;

-- Grant permissions for Supabase Auth to execute this hook
GRANT EXECUTE ON FUNCTION public.check_is_admin(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.check_is_admin(jsonb) FROM authenticated, anon, public;
