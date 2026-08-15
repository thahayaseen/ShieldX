// A.E.G.I.S. – API Client (web-app)
import axios from 'axios';
import type {
  ApiResponse,
  ChatRequest,
  ChatResponse,
  Hero,
  HeroStatus,
  Incident,
  Mission,
  MissionStatus,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

export const heroesApi = {
  getAll: async (): Promise<Hero[]> => {
    const { data } = await apiClient.get<ApiResponse<Hero[]>>('/api/heroes');
    return data.data;
  },
  getAvailable: async (): Promise<Hero[]> => {
    const { data } = await apiClient.get<ApiResponse<Hero[]>>('/api/heroes/available');
    return data.data;
  },
  getById: async (id: string): Promise<Hero> => {
    const { data } = await apiClient.get<ApiResponse<Hero>>(`/api/heroes/${id}`);
    return data.data;
  },
  updateStatus: async (id: string, status: HeroStatus): Promise<void> => {
    await apiClient.put(`/api/heroes/${id}/status`, { status });
  },
};

export const missionsApi = {
  getAll: async (): Promise<Mission[]> => {
    const { data } = await apiClient.get<ApiResponse<Mission[]>>('/api/missions');
    return data.data;
  },
  getById: async (id: string): Promise<Mission> => {
    const { data } = await apiClient.get<ApiResponse<Mission>>(`/api/missions/${id}`);
    return data.data;
  },
  updateStatus: async (id: string, status: MissionStatus): Promise<void> => {
    await apiClient.put(`/api/missions/${id}/status`, { status });
  },
  assignHero: async (missionId: string, heroId: string): Promise<void> => {
    await apiClient.post(`/api/missions/${missionId}/assign`, { heroId });
  },
};

export const incidentsApi = {
  getAll: async (): Promise<Incident[]> => {
    const { data } = await apiClient.get<ApiResponse<Incident[]>>('/api/incidents');
    return data.data;
  },
  getBreaking: async (): Promise<Incident[]> => {
    const { data } = await apiClient.get<ApiResponse<Incident[]>>('/api/incidents/breaking');
    return data.data;
  },
  report: async (payload: Partial<Incident>): Promise<Incident> => {
    const { data } = await apiClient.post<ApiResponse<Incident>>('/api/incidents', payload);
    return data.data;
  },
};

export const dispatchApi = {
  analyze: async (incidentId: string) => {
    const { data } = await apiClient.post('/api/dispatch/analyze', { incidentId });
    return data;
  },
  autoDipatch: async (incidentId: string) => {
    const { data } = await apiClient.post('/api/dispatch/auto', { incidentId });
    return data;
  },
};

export const chatApi = {
  sendMessage: async (req: ChatRequest): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>('/api/chat', req);
    return data;
  },
};
