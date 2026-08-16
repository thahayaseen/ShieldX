// A.E.G.I.S. – Chat & Voice Helpers (web-app)
// Routes all queries through the live Supabase voice-agent edge function
import type { ChatMessage } from '../types';

const VOICE_AGENT_URL =
  import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') + '/functions/v1/voice-agent' ||
  'https://gxpnrryuzvgrdpgkltpx.supabase.co/functions/v1/voice-agent';

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Send a text query to the Supabase voice-agent edge function.
 */
export async function sendToVoiceAgent(userText: string): Promise<string> {
  const response = await fetch(VOICE_AGENT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ text: userText }),
  });

  if (!response.ok) {
    throw new Error(`Voice agent error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  // Accept either { reply: string } or { response: string } or { text: string }
  return data.reply || data.response || data.text || data.message || JSON.stringify(data);
}

/**
 * Send base64 audio query directly to the Supabase voice-agent edge function.
 */
export async function sendAudioToVoiceAgent(base64Audio: string, mimeType: string = 'audio/webm'): Promise<string> {
  const response = await fetch(VOICE_AGENT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      audio: base64Audio,
      mimeType,
    }),
  });

  if (!response.ok) {
    throw new Error(`Voice agent error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.reply || data.response || data.text || data.message || JSON.stringify(data);
}

/**
 * Send a text message, get back user and agent chat messages.
 */
export async function sendTextMessage(
  userText: string
): Promise<{ userMsg: ChatMessage; agentMsg: ChatMessage }> {
  const userMsg: ChatMessage = {
    id: uid(),
    role: 'user',
    content: userText,
    timestamp: new Date().toISOString(),
  };

  const reply = await sendToVoiceAgent(userText);

  const agentMsg: ChatMessage = {
    id: uid(),
    role: 'agent',
    content: reply,
    timestamp: new Date().toISOString(),
  };

  return { userMsg, agentMsg };
}

/**
 * Speak agent reply aloud via browser Web Speech Synthesis.
 */
export function speakText(text: string) {
  if (!window.speechSynthesis) return;
  // Cancel any in-progress speech
  window.speechSynthesis.cancel();
  // Strip markdown formatting for cleaner TTS
  const cleaned = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#+\s/g, '')
    .replace(/\n+/g, '. ');
  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.rate = 0.95;
  utterance.pitch = 0.85;
  utterance.volume = 1;
  // Prefer a deep, authoritative voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.name.includes('Daniel') ||
      v.name.includes('Google UK English Male') ||
      v.name.includes('David') ||
      v.name.includes('Alex')
  );
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

export const SUGGESTED_PROMPTS = [
  'What are the active missions right now?',
  'Which hero is assigned to the current mission?',
  'Any breaking emergencies right now?',
  'Show all available heroes',
  'Give me a full system overview',
] as const;
