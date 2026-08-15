-- ============================================================
-- A.E.G.I.S. – Migration 7: Fix Admin Recursion
-- ============================================================

-- The previous migration might have been applied with the broken policy
-- or the modified file was ignored by Supabase because the migration 
-- name/timestamp was already recorded in the migrations table.

-- Create a security definer function to safely check admin status 
-- Bypasses RLS to prevent infinite recursion when querying admin_users
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE email = auth.jwt()->>'email'
  );
END;
$$;

-- 1. Fix infinite recursion on admin_users table
DROP POLICY IF EXISTS "Admins can view admins" ON public.admin_users;

CREATE POLICY "Admins can view admins" ON public.admin_users
  FOR SELECT USING (public.is_admin());

-- 2. Heroes table policies (Replace the previous ones to ensure they use the function)
DROP POLICY IF EXISTS "heroes_insert_admin" ON heroes;
DROP POLICY IF EXISTS "heroes_update_admin" ON heroes;
DROP POLICY IF EXISTS "heroes_delete_admin" ON heroes;

CREATE POLICY "heroes_insert_admin"
  ON heroes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "heroes_update_admin"
  ON heroes FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "heroes_delete_admin"
  ON heroes FOR DELETE
  TO authenticated
  USING (public.is_admin());
