// ============================================================
// A.E.G.I.S. – API Client (Mobile)
// Axios instance + typed request helpers.
// All calls go to the Node.js backend — never to MCP directly.
// ============================================================

import axios, { AxiosError } from 'axios';

import type {
  ApiResponse,
  ChatRequest,
  ChatResponse,
  ChatVoiceRequest,
  Hero,
  HeroStatus,
  Incident,
  Mission,
  MissionStatus,
} from '@/types';

// ─── Config ──────────────────────────────────────────────────

// Set EXPO_PUBLIC_API_URL in your .env file
// e.g. EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Error helper ────────────────────────────────────────────

function extractError(err: unknown): string {
  if (err instanceof AxiosError) {
    return err.response?.data?.error ?? err.message;
  }
  return 'Unknown error';
}

// ─── Heroes ──────────────────────────────────────────────────

export const heroesApi = {
  /** GET /api/heroes — fetch all heroes */
  getAll: async (): Promise<Hero[]> => {
    const { data } = await apiClient.get<ApiResponse<Hero[]>>('/api/heroes');
    return data.data;
  },

  /** GET /api/heroes/available — fetch heroes not on mission */
  getAvailable: async (): Promise<Hero[]> => {
    const { data } = await apiClient.get<ApiResponse<Hero[]>>('/api/heroes/available');
    return data.data;
  },

  /** GET /api/heroes/:id */
  getById: async (id: string): Promise<Hero> => {
    const { data } = await apiClient.get<ApiResponse<Hero>>(`/api/heroes/${id}`);
    return data.data;
  },

  /** PUT /api/heroes/:id/status */
  updateStatus: async (id: string, status: HeroStatus): Promise<void> => {
    await apiClient.put(`/api/heroes/${id}/status`, { status });
  },
};

// ─── Missions ────────────────────────────────────────────────

export const missionsApi = {
  /** GET /api/missions */
  getAll: async (): Promise<Mission[]> => {
    const { data } = await apiClient.get<ApiResponse<Mission[]>>('/api/missions');
    return data.data;
  },

  /** GET /api/missions/:id */
  getById: async (id: string): Promise<Mission> => {
    const { data } = await apiClient.get<ApiResponse<Mission>>(`/api/missions/${id}`);
    return data.data;
  },

  /** PUT /api/missions/:id/status */
  updateStatus: async (id: string, status: MissionStatus): Promise<void> => {
    await apiClient.put(`/api/missions/${id}/status`, { status });
  },

  /** POST /api/missions/:id/assign */
  assignHero: async (missionId: string, heroId: string): Promise<void> => {
    await apiClient.post(`/api/missions/${missionId}/assign`, { heroId });
  },
};

// ─── Incidents ───────────────────────────────────────────────

export const incidentsApi = {
  /** GET /api/incidents */
  getAll: async (): Promise<Incident[]> => {
    const { data } = await apiClient.get<ApiResponse<Incident[]>>('/api/incidents');
    return data.data;
  },

  /** GET /api/incidents/breaking */
  getBreaking: async (): Promise<Incident[]> => {
    const { data } = await apiClient.get<ApiResponse<Incident[]>>('/api/incidents/breaking');
    return data.data;
  },
};

// ─── AI Chat ─────────────────────────────────────────────────

import { supabase } from './supabase';

export const chatApi = {
  /**
   * Send a text message to the AI Agent backend.
   * The backend handles MCP tool calls internally — never exposed to frontend.
   */
  sendMessage: async (req: ChatRequest): Promise<ChatResponse> => {
    // We can also route this through edge function if needed, but for now we'll
    // assume both voice and text go to the same voice-agent edge function,
    // or we'll update it to use the new edge function url.
    const { data: { session } } = await supabase.auth.getSession();
    const headers = session ? { Authorization: `Bearer ${session.access_token}` } : {};
    
    // For text, we can use the same edge function if it supports text, or fallback.
    // Given the prompt, we'll route to the voice-agent endpoint for both or just voice.
    const url = 'https://gxpnrryuzvgrdpgkltpx.supabase.co/functions/v1/voice-agent';
    const { data } = await apiClient.post<ChatResponse>(url, req, { headers });
    return data;
  },

  /**
   * Send a voice recording (base64 .m4a) to the AI Agent backend.
   * Backend transcribes → runs AI agent → returns { reply, transcript }.
   */
  sendVoice: async (req: ChatVoiceRequest): Promise<ChatResponse> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = session ? { Authorization: `Bearer ${session.access_token}` } : {};
    
    const url = 'https://gxpnrryuzvgrdpgkltpx.supabase.co/functions/v1/voice-agent';
    const { data } = await apiClient.post<ChatResponse>(url, req, { headers });
    return data;
  },
};
