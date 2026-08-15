// ============================================================
// A.E.G.I.S. – Chat Helpers (Mobile)
// Text + voice message flows for the AI Comms screen.
//
// ARCHITECTURE REMINDER:
//   Frontend → POST /api/chat → Node.js Backend
//   → AI Agent (Gemini) → MCP Server → Supabase
//   ← { reply } ← ← ← ← ← ← ← ← ← ←
//
// The frontend NEVER calls the MCP Server directly.
// ============================================================

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

import { chatApi } from './api';
import type { ChatMessage } from '@/types';

// ─── Unique ID helper ────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Text chat ───────────────────────────────────────────────

/**
 * Send a plain text message to the A.E.G.I.S. AI agent.
 * Returns the agent's reply as a ChatMessage ready to render.
 */
export async function sendTextMessage(
  userText: string,
  sessionId: string
): Promise<{ userMsg: ChatMessage; agentMsg: ChatMessage }> {
  const userMsg: ChatMessage = {
    id: uid(),
    role: 'user',
    content: userText,
    timestamp: new Date().toISOString(),
  };

  const { reply } = await chatApi.sendMessage({ message: userText, sessionId });

  const agentMsg: ChatMessage = {
    id: uid(),
    role: 'agent',
    content: reply,
    timestamp: new Date().toISOString(),
  };

  return { userMsg, agentMsg };
}

// ─── Voice recording ─────────────────────────────────────────

let recording: Audio.Recording | null = null;

/** Request mic permission and start recording. */
export async function startRecording(): Promise<void> {
  const { status } = await Audio.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Microphone permission denied');
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording: rec } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  recording = rec;
}

/**
 * Stop recording and send the audio to the backend AI agent.
 * Returns both user + agent ChatMessage objects for the UI.
 */
export async function stopRecordingAndSend(
  sessionId: string
): Promise<{ userMsg: ChatMessage; agentMsg: ChatMessage }> {
  if (!recording) throw new Error('No active recording');

  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  recording = null;

  if (!uri) throw new Error('Recording URI is null');

  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { reply, transcript } = await chatApi.sendVoice({ audio: base64, sessionId });

  const userMsg: ChatMessage = {
    id: uid(),
    role: 'user',
    content: transcript ?? '🎤 Voice message',
    transcript,
    isVoice: true,
    timestamp: new Date().toISOString(),
  };

  const agentMsg: ChatMessage = {
    id: uid(),
    role: 'agent',
    content: reply,
    timestamp: new Date().toISOString(),
  };

  return { userMsg, agentMsg };
}

// ─── Suggested prompts ───────────────────────────────────────

export const SUGGESTED_PROMPTS = [
  'Which hero is assigned to the current mission?',
  'Any breaking emergencies right now?',
  "What is Thor's current status?",
  'Give me a full system overview',
  'Who is available for dispatch?',
] as const;
