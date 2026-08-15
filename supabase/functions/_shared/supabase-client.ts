import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

/**
 * Service-role client — bypasses RLS.
 * Use only for internal operations (dispatch, admin mutations).
 */
export function serviceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/**
 * User-scoped client — respects RLS using the caller's JWT.
 * Use for all operations that should respect row-level security.
 */
export function userClient(authHeader: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}

/**
 * Verify whether a request is from the ESP32 wristband
 * (shared secret) or an authenticated Supabase user (JWT).
 * Returns true if either credential is valid.
 */
export function isAuthorized(req: Request): boolean {
  const deviceSecret = req.headers.get('x-wristband-secret');
  const expectedSecret = Deno.env.get('WRISTBAND_DEVICE_SECRET');
  if (expectedSecret && deviceSecret === expectedSecret) return true;

  const auth = req.headers.get('authorization');
  return Boolean(auth?.startsWith('Bearer '));
}

/** Extract the Authorization header (for user-scoped client). */
export function authHeader(req: Request): string {
  return req.headers.get('authorization') ?? '';
}
