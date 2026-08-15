/**
 * A.E.G.I.S. – Edge Function: /functions/v1/heroes
 *
 * GET    /heroes              → all heroes
 * GET    /heroes/available    → available heroes (via SQL function)
 * GET    /heroes/:id          → single hero
 * PUT    /heroes/:id/status   → update hero status (JWT or wristband secret)
 */

import { handleCors, ok, err } from '../_shared/cors.ts';
import {
  serviceClient,
  userClient,
  isAuthorized,
  authHeader,
} from '../_shared/supabase-client.ts';

/** Extract sub-path segments after the function name in the URL. */
function subPath(req: Request): string[] {
  const pathname = new URL(req.url).pathname;
  const parts = pathname.split('/').filter(Boolean);
  const idx = parts.lastIndexOf('heroes');
  return idx === -1 ? [] : parts.slice(idx + 1);
}

Deno.serve(async (req: Request) => {
  // ── CORS preflight ─────────────────────────────────────────
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const method = req.method;
  const segments = subPath(req);
  const db = serviceClient();

  try {
    // GET /heroes/available
    if (method === 'GET' && segments[0] === 'available') {
      const { data, error } = await db.rpc('get_available_heroes');
      if (error) return err(error.message);
      return ok({ heroes: data });
    }

    // GET /heroes/:id
    if (method === 'GET' && segments.length === 1 && segments[0] !== 'available') {
      const { data, error } = await db
        .from('heroes')
        .select('*')
        .eq('id', segments[0])
        .single();
      if (error) return err('Hero not found.', 404);
      return ok({ hero: data });
    }

    // PUT /heroes/:id/status
    if (method === 'PUT' && segments.length === 2 && segments[1] === 'status') {
      if (!isAuthorized(req)) return err('Unauthorized.', 401);

      const body = await req.json();
      const status = body?.status;
      const validStatuses = ['available', 'on_mission', 'offline', 'injured'];
      if (!status || !validStatuses.includes(status)) {
        return err('Invalid status. Must be: available | on_mission | offline | injured', 400);
      }

      const { data, error } = await db.rpc('update_hero_status', {
        hero_id: segments[0],
        new_status: status,
      });
      if (error) return err(error.message);
      return ok({ hero: data });
    }

    // GET /heroes (all)
    if (method === 'GET' && segments.length === 0) {
      const { data, error } = await db.from('heroes').select('*').order('name');
      if (error) return err(error.message);
      return ok({ heroes: data });
    }

    return err('Route not found.', 404);
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error');
  }
});
