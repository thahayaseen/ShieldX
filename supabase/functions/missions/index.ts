/**
 * A.E.G.I.S. – Edge Function: /functions/v1/missions
 *
 * GET    /missions              → all missions (with hero join)
 * GET    /missions/:id          → single mission (with hero + incident)
 * POST   /missions              → create mission
 * PUT    /missions/:id          → update mission fields
 * POST   /missions/:id/assign   → assign hero (uses atomic SQL function)
 * PUT    /missions/:id/status   → update status (uses complete_mission if completed)
 */

import { handleCors, ok, err } from '../_shared/cors.ts';
import { serviceClient, isAuthorized } from '../_shared/supabase-client.ts';

function subPath(req: Request): string[] {
  const pathname = new URL(req.url).pathname;
  const parts = pathname.split('/').filter(Boolean);
  const idx = parts.lastIndexOf('missions');
  return idx === -1 ? [] : parts.slice(idx + 1);
}

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
const VALID_STATUSES = [
  'pending', 'dispatched', 'accepted', 'en_route',
  'arrived', 'in_progress', 'completed', 'failed', 'cancelled',
] as const;

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const method = req.method;
  const segments = subPath(req);
  const db = serviceClient();

  try {
    // GET /missions (all with hero data)
    if (method === 'GET' && segments.length === 0) {
      const { data, error } = await db
        .from('missions')
        .select('*, heroes(*)')
        .order('created_at', { ascending: false });
      if (error) return err(error.message);
      return ok({ missions: data });
    }

    // GET /missions/:id
    if (method === 'GET' && segments.length === 1) {
      const { data, error } = await db
        .from('missions')
        .select('*, heroes(*), incidents(*)')
        .eq('id', segments[0])
        .single();
      if (error) return err('Mission not found.', 404);
      return ok({ mission: data });
    }

    // POST /missions (create)
    if (method === 'POST' && segments.length === 0) {
      if (!isAuthorized(req)) return err('Unauthorized.', 401);
      const body = await req.json();
      if (!body.title || !body.priority) {
        return err('title and priority are required.', 400);
      }
      if (!VALID_PRIORITIES.includes(body.priority)) {
        return err('Invalid priority.', 400);
      }
      const { data, error } = await db
        .from('missions')
        .insert({
          title: body.title,
          description: body.description ?? null,
          location: body.location ?? null,
          priority: body.priority,
          required_powers: body.required_powers ?? [],
          incident_id: body.incident_id ?? null,
        })
        .select()
        .single();
      if (error) return err(error.message);
      return ok({ mission: data }, { status: 201 });
    }

    // PUT /missions/:id (update fields)
    if (method === 'PUT' && segments.length === 1) {
      if (!isAuthorized(req)) return err('Unauthorized.', 401);
      const body = await req.json();
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.title !== undefined) update.title = body.title;
      if (body.description !== undefined) update.description = body.description;
      if (body.location !== undefined) update.location = body.location;
      if (body.priority !== undefined) update.priority = body.priority;
      if (body.status !== undefined) update.status = body.status;
      if (body.required_powers !== undefined) update.required_powers = body.required_powers;
      if (body.eta_minutes !== undefined) update.eta_minutes = body.eta_minutes;

      const { data, error } = await db
        .from('missions')
        .update(update)
        .eq('id', segments[0])
        .select()
        .single();
      if (error) return err(error.message);
      return ok({ mission: data });
    }

    // POST /missions/:id/assign
    if (method === 'POST' && segments.length === 2 && segments[1] === 'assign') {
      if (!isAuthorized(req)) return err('Unauthorized.', 401);
      const body = await req.json();
      if (!body.hero_id) return err('hero_id is required.', 400);

      const { data, error } = await db.rpc('assign_hero_to_mission', {
        p_mission_id: segments[0],
        p_hero_id: body.hero_id,
        p_reasoning: body.reasoning ?? null,
      });
      if (error) return err(error.message, 400);
      return ok({ mission: data });
    }

    // PUT /missions/:id/status
    if (method === 'PUT' && segments.length === 2 && segments[1] === 'status') {
      if (!isAuthorized(req)) return err('Unauthorized.', 401);
      const body = await req.json();
      if (!body.status || !VALID_STATUSES.includes(body.status)) {
        return err('Invalid status.', 400);
      }

      // Use the complete_mission SQL function to also free the hero
      if (body.status === 'completed') {
        const { data, error } = await db.rpc('complete_mission', { p_mission_id: segments[0] });
        if (error) return err(error.message);
        return ok({ mission: data });
      }

      const { data, error } = await db
        .from('missions')
        .update({ status: body.status, updated_at: new Date().toISOString() })
        .eq('id', segments[0])
        .select()
        .single();
      if (error) return err(error.message);
      return ok({ mission: data });
    }

    return err('Route not found.', 404);
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error');
  }
});
