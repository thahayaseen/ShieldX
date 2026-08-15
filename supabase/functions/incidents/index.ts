/**
 * A.E.G.I.S. – Edge Function: /functions/v1/incidents
 *
 * GET    /incidents              → all incidents (optional ?status= &severity=)
 * GET    /incidents/breaking     → recent unresolved (optional ?minutes=30)
 * GET    /incidents/:id          → single incident (with mission)
 * POST   /incidents              → report new incident
 * PUT    /incidents/:id/status   → update incident status
 */

import { handleCors, ok, err } from '../_shared/cors.ts';
import { serviceClient, isAuthorized } from '../_shared/supabase-client.ts';

function subPath(req: Request): string[] {
  const pathname = new URL(req.url).pathname;
  const parts = pathname.split('/').filter(Boolean);
  const idx = parts.lastIndexOf('incidents');
  return idx === -1 ? [] : parts.slice(idx + 1);
}

const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
const VALID_STATUSES = ['reported', 'under_review', 'dispatched', 'resolved', 'closed'] as const;

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const method = req.method;
  const segments = subPath(req);
  const url = new URL(req.url);
  const db = serviceClient();

  try {
    // GET /incidents/breaking
    if (method === 'GET' && segments[0] === 'breaking') {
      const minutes = parseInt(url.searchParams.get('minutes') ?? '30', 10);
      const { data, error } = await db.rpc('get_breaking_incidents', { minutes });
      if (error) return err(error.message);
      return ok({ incidents: data, minutes });
    }

    // GET /incidents (all, with optional filters)
    if (method === 'GET' && segments.length === 0) {
      let query = db
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      const status = url.searchParams.get('status');
      const severity = url.searchParams.get('severity');
      if (status) query = query.eq('status', status);
      if (severity) query = query.eq('severity', severity);

      const { data, error } = await query;
      if (error) return err(error.message);
      return ok({ incidents: data });
    }

    // GET /incidents/:id
    if (method === 'GET' && segments.length === 1) {
      const { data, error } = await db
        .from('incidents')
        .select('*, missions(*)')
        .eq('id', segments[0])
        .single();
      if (error) return err('Incident not found.', 404);
      return ok({ incident: data });
    }

    // POST /incidents (report new)
    if (method === 'POST' && segments.length === 0) {
      if (!isAuthorized(req)) return err('Unauthorized.', 401);
      const body = await req.json();
      if (!body.title || !body.severity) {
        return err('title and severity are required.', 400);
      }
      if (!VALID_SEVERITIES.includes(body.severity)) {
        return err('Invalid severity.', 400);
      }

      const { data, error } = await db
        .from('incidents')
        .insert({
          title: body.title,
          description: body.description ?? null,
          severity: body.severity,
          location: body.location ?? null,
        })
        .select()
        .single();
      if (error) return err(error.message);
      return ok({ incident: data }, { status: 201 });
    }

    // PUT /incidents/:id/status
    if (method === 'PUT' && segments.length === 2 && segments[1] === 'status') {
      if (!isAuthorized(req)) return err('Unauthorized.', 401);
      const body = await req.json();
      if (!body.status || !VALID_STATUSES.includes(body.status)) {
        return err('Invalid status.', 400);
      }

      const { data, error } = await db
        .from('incidents')
        .update({ status: body.status, updated_at: new Date().toISOString() })
        .eq('id', segments[0])
        .select()
        .single();
      if (error) return err(error.message);
      return ok({ incident: data });
    }

    return err('Route not found.', 404);
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error');
  }
});
