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

export const chatApi = {
  /**
   * Send a text message to the AI Agent backend.
   * The backend handles MCP tool calls internally — never exposed to frontend.
   */
  sendMessage: async (req: ChatRequest): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>('/api/chat', req);
    return data;
  },

  /**
   * Send a voice recording (base64 .m4a) to the AI Agent backend.
   * Backend transcribes → runs AI agent → returns { reply, transcript }.
   */
  sendVoice: async (req: ChatVoiceRequest): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>('/api/chat/voice', req);
    return data;
  },
};
