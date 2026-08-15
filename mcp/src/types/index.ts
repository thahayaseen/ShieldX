export interface Hero {
  id: string;
  name: string;
  codename: string;
  powers: string[];
  status: 'online' | 'busy' | 'mission_active' | 'offline';
  location?: any;
  created_at: string;
  updated_at: string;
}

export interface Mission {
  id: string;
  title: string;
  description?: string;
  location?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  required_powers: string[];
  assigned_hero_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: any;
  status: 'reported' | 'in_progress' | 'resolved';
  created_at: string;
}

export interface Message {
  id: string;
  sender_id?: string;
  content: string;
  message_type: 'text' | 'voice' | 'system';
  mission_id?: string;
  created_at: string;
}
