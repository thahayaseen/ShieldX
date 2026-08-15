/**
 * A.E.G.I.S. – Edge Function: /functions/v1/dispatch
 *
 * POST /dispatch/analyze  → AI analysis + hero recommendation (no side-effects)
 * POST /dispatch/auto     → Full pipeline: incident → mission → assign hero
 * GET  /dispatch/overview → System overview snapshot
 */

import { handleCors, ok, err } from '../_shared/cors.ts';
import { serviceClient, isAuthorized } from '../_shared/supabase-client.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

function subPath(req: Request): string[] {
  const pathname = new URL(req.url).pathname;
  const parts = pathname.split('/').filter(Boolean);
  const idx = parts.lastIndexOf('dispatch');
  return idx === -1 ? [] : parts.slice(idx + 1);
}

// ─── Types ────────────────────────────────────────────────────
interface Hero {
  id: string;
  codename: string;
  powers: string[];
  status: string;
}

interface DispatchBody {
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: { city: string; address?: string; lat: number; lng: number };
  auto_assign?: boolean;
}

interface AIResult {
  recommended_hero_id: string;
  recommended_hero_codename: string;
  reasoning: string;
  confidence: number;
  required_powers: string[];
  threat_level: string;
}

// ─── Rule-based power matching fallback ──────────────────────
function ruleBasedSelect(heroes: Hero[], body: DispatchBody): AIResult {
  const keywords = `${body.title} ${body.description ?? ''}`.toLowerCase();
  const powerMap = [
    { kw: ['collapse', 'rubble', 'building', 'structural'], powers: ['super-strength', 'rescue', 'durability'] },
    { kw: ['fire', 'burn', 'flame', 'explosion'], powers: ['rescue', 'flight', 'durability'] },
    { kw: ['energy', 'anomaly', 'portal', 'dimensional', 'alien'], powers: ['lightning', 'energy-beams', 'magic'] },
    { kw: ['hostage', 'terror', 'infiltrat', 'covert'], powers: ['espionage', 'stealth', 'tactics'] },
    { kw: ['cyber', 'hack', 'digital'], powers: ['hacking', 'genius-intellect'] },
  ];

  let required: string[] = ['super-strength', 'rescue'];
  for (const entry of powerMap) {
    if (entry.kw.some((k) => keywords.includes(k))) { required = entry.powers; break; }
  }

  const scored = heroes.map((h) => {
    const hl = h.powers.map((p) => p.toLowerCase());
    const matched = required.filter((r) => hl.some((hp) => hp.includes(r) || r.includes(hp)));
    return { hero: h, score: Math.round((matched.length / required.length) * 100) };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  return {
    recommended_hero_id: best.hero.id,
    recommended_hero_codename: best.hero.codename,
    reasoning: `${best.hero.codename} selected via power matching (${best.score}% match). Required: ${required.join(', ')}.`,
    confidence: best.score,
    required_powers: required,
    threat_level: body.severity,
  };
}

// ─── Gemini AI dispatch ───────────────────────────────────────
async function geminiSelect(heroes: Hero[], body: DispatchBody): Promise<AIResult> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const heroList = heroes.map((h) => `- ${h.codename} (powers: ${h.powers.join(', ')})`).join('\n');
  const prompt = `
You are A.E.G.I.S., the AI Emergency Guardian Intelligence System.

EMERGENCY INCIDENT:
Title: ${body.title}
Description: ${body.description ?? 'No additional details'}
Severity: ${body.severity}
Location: ${body.location?.city ?? 'Unknown'}

AVAILABLE HEROES:
${heroList}

Select the SINGLE best hero. Respond ONLY with valid JSON:
{
  "recommended_hero_codename": "<codename>",
  "reasoning": "<1-2 sentence explanation>",
  "confidence": <0-100>,
  "required_powers": ["<power1>", "<power2>"],
  "threat_level": "<low|medium|high|critical>"
}`.trim();

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid Gemini response');

  const parsed = JSON.parse(jsonMatch[0]);
  const hero = heroes.find((h) => h.codename.toLowerCase() === parsed.recommended_hero_codename.toLowerCase());
  if (!hero) throw new Error(`Unknown hero: ${parsed.recommended_hero_codename}`);

  return {
    recommended_hero_id: hero.id,
    recommended_hero_codename: hero.codename,
    reasoning: parsed.reasoning,
    confidence: parsed.confidence,
    required_powers: parsed.required_powers,
    threat_level: parsed.threat_level,
  };
}

async function analyzeAndRecommend(db: ReturnType<typeof serviceClient>, body: DispatchBody): Promise<AIResult> {
  const { data: heroes, error } = await db.from('heroes').select('*').eq('status', 'available');
  if (error) throw new Error(`Failed to fetch heroes: ${error.message}`);
  if (!heroes || heroes.length === 0) throw new Error('No available heroes at this time.');

  try {
    return await geminiSelect(heroes as Hero[], body);
  } catch (_) {
    return ruleBasedSelect(heroes as Hero[], body);
  }
}

// ─── Main handler ─────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const method = req.method;
  const segments = subPath(req);
  const db = serviceClient();

  try {
    // GET /dispatch/overview
    if (method === 'GET' && segments[0] === 'overview') {
      const { data, error } = await db.from('system_overview').select('*').single();
      if (error) return err(error.message);
      return ok({ overview: data });
    }

    // POST /dispatch/analyze  — recommendation only, no DB writes
    if (method === 'POST' && segments[0] === 'analyze') {
      if (!isAuthorized(req)) return err('Unauthorized.', 401);
      const body: DispatchBody = await req.json();
      if (!body.title || !body.severity) return err('title and severity are required.', 400);

      const result = await analyzeAndRecommend(db, body);
      return ok({ result });
    }

    // POST /dispatch/auto  — full pipeline: incident → mission → assign
    if (method === 'POST' && segments[0] === 'auto') {
      if (!isAuthorized(req)) return err('Unauthorized.', 401);
      const body: DispatchBody = await req.json();
      if (!body.title || !body.severity) return err('title and severity are required.', 400);

      // 1. AI recommendation
      const aiResult = await analyzeAndRecommend(db, body);

      // 2. Create incident
      const { data: incident, error: incErr } = await db
        .from('incidents')
        .insert({ title: body.title, description: body.description ?? null, severity: body.severity, location: body.location ?? null, status: 'dispatched' })
        .select().single();
      if (incErr) return err(`Failed to create incident: ${incErr.message}`);

      // 3. Create mission
      const { data: mission, error: missionErr } = await db
        .from('missions')
        .insert({
          title: `Operation: ${body.title}`,
          description: body.description ?? null,
          location: body.location ?? null,
          priority: body.severity,
          required_powers: aiResult.required_powers,
          incident_id: incident.id,
          ai_reasoning: aiResult.reasoning,
        })
        .select().single();
      if (missionErr) return err(`Failed to create mission: ${missionErr.message}`);

      // 4. Assign hero (if auto_assign !== false)
      if (body.auto_assign !== false) {
        const { data: assignedMission, error: assignErr } = await db.rpc('assign_hero_to_mission', {
          p_mission_id: mission.id,
          p_hero_id: aiResult.recommended_hero_id,
          p_reasoning: aiResult.reasoning,
        });
        if (assignErr) return err(`Failed to assign hero: ${assignErr.message}`);

        const { data: hero } = await db.from('heroes').select('*').eq('id', aiResult.recommended_hero_id).single();
        return ok({ incident, mission: assignedMission, hero, ai_result: aiResult }, { status: 201 });
      }

      return ok({ incident, mission, ai_result: aiResult }, { status: 201 });
    }

    return err('Route not found.', 404);
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error');
  }
});
