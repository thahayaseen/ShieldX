// ============================================================
// A.E.G.I.S. – Shared TypeScript Types
// Mirrors the Supabase database schema exactly.
// Both Mobile App and web-app import from their own copy.
// ============================================================

// ─── Enums / Union Types ────────────────────────────────────

export type HeroStatus = 'online' | 'busy' | 'on_mission' | 'offline';

export type MissionStatus =
  | 'pending'
  | 'accepted'
  | 'en_route'
  | 'arrived'
  | 'complete'
  | 'failed';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 'reported' | 'analyzing' | 'dispatched' | 'resolved';

export type MessageType = 'text' | 'voice' | 'system';

// ─── Core Entities ──────────────────────────────────────────

export interface GeoLocation {
  lat: number;
  lng: number;
  label?: string; // e.g. "Calicut City Center"
}

export interface Hero {
  id: string;
  name: string;         // Real name e.g. "Peter Parker"
  codename: string;     // Hero name e.g. "Spider-Man"
  powers: string[];
  status: HeroStatus;
  location: GeoLocation | null;
  avatarUrl?: string;
  brandColor: string;   // Hex — unique per hero for UI theming
  createdAt: string;
  updatedAt: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  location: GeoLocation;
  priority: Priority;
  status: MissionStatus;
  requiredPowers: string[];
  assignedHeroId: string | null;
  assignedHero?: Hero;  // Populated by joins
  incidentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string | null;
  severity: IncidentSeverity;
  location: GeoLocation;
  status: IncidentStatus;
  aiAnalysis?: AiAnalysis; // Populated by AI dispatch
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string | null;
  sender?: Hero;        // Populated by joins
  content: string;
  messageType: MessageType;
  missionId: string | null;
  createdAt: string;
}

// ─── AI Dispatch ─────────────────────────────────────────────

export interface AiAnalysis {
  threatLevel: Priority;
  requiredPowers: string[];
  recommendedHeroId: string;
  reasoning: string;
  confidence: number; // 0–1
}

// ─── Chat / MCP ──────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  transcript?: string;  // For voice messages — the transcribed text
  isVoice?: boolean;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatVoiceRequest {
  audio: string;        // base64-encoded .m4a
  sessionId?: string;
}

export interface ChatResponse {
  reply: string;
  transcript?: string;  // Returned for voice requests
}

// ─── Socket.IO Events ────────────────────────────────────────

export interface SocketEvents {
  'mission:assigned': { mission: Mission; hero: Hero };
  'mission:statusChanged': { missionId: string; status: MissionStatus };
  'hero:statusChanged': { heroId: string; status: HeroStatus };
  'incident:created': { incident: Incident };
  'message:new': { message: Message };
}

// ─── API Response Wrappers ───────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}
