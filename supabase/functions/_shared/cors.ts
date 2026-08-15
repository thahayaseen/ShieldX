// ─── Shared CORS headers for all Edge Functions ──────────────
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-wristband-secret',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/** Returns a pre-flight 200 response for OPTIONS requests. */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
  return null;
}

/** Wraps a Response with CORS headers. */
export function cors(body: unknown, init: ResponseInit = {}): Response {
  const headers = { 'Content-Type': 'application/json', ...corsHeaders };
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...headers, ...(init.headers ?? {}) },
  });
}

export function ok(body: unknown, status = 200): Response {
  return cors(body, { status });
}

export function err(message: string, status = 500): Response {
  return cors({ error: message }, { status });
}
