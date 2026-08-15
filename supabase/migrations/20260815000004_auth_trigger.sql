-- ============================================================
-- A.E.G.I.S. – Migration 4: Auth Trigger for Heroes
-- ============================================================

-- This function automatically creates a record in the `heroes` table
-- whenever a new user signs up via Supabase Authentication.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.heroes (user_id, name, codename, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown Hero'),
    -- Fallback for codename if not provided during signup
    COALESCE(new.raw_user_meta_data->>'codename', 'Agent_' || substr(new.id::text, 1, 8)),
    'offline'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
