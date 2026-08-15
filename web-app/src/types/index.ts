// A.E.G.I.S. – Shared TypeScript Types (web-app copy)
// Mirrors Mobile_App/src/types/index.ts exactly.

export type HeroStatus = 'online' | 'busy' | 'on_mission' | 'offline';

export type MissionStatus =
  | 'pending'
  | 'dispatched'
  | 'accepted'
  | 'en_route'
  | 'arrived'
  | 'complete'
  | 'failed';

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'analyzing' | 'dispatched' | 'resolved';
export type MessageType = 'text' | 'voice' | 'system';

export interface GeoLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface Hero {
  id: string;
  name: string;
  codename: string;
  powers: string[];
  status: HeroStatus;
  location: GeoLocation | null;
  avatarUrl?: string;
  brandColor: string;
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
  assignedHero?: Hero;
  incidentId?: string;
  aiReasoning?: string;
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
  aiAnalysis?: AiAnalysis;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string | null;
  sender?: Hero;
  content: string;
  messageType: MessageType;
  missionId: string | null;
  createdAt: string;
}

export interface AiAnalysis {
  threatLevel: Priority;
  requiredPowers: string[];
  recommendedHeroId: string;
  reasoning: string;
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  reply: string;
  transcript?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface SocketEvents {
  'mission:assigned': { mission: Mission; hero: Hero };
  'mission:statusChanged': { missionId: string; status: MissionStatus };
  'hero:statusChanged': { heroId: string; status: HeroStatus };
  'incident:created': { incident: Incident };
  'message:new': { message: Message };
}
