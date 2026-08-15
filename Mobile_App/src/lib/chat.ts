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

import { AudioRecorder, RecordingPresets, requestMicrophonePermissionsAsync, setAudioModeAsync } from 'expo-audio';
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

let recorder: AudioRecorder | null = null;

/** Request mic permission and start recording. */
export async function startRecording(): Promise<void> {
  // Request mic permission — shows the system dialog on first call
  const { status, canAskAgain } = await requestMicrophonePermissionsAsync();
  if (status !== 'granted') {
    throw new Error(
      canAskAgain
        ? 'Microphone permission denied. Please allow microphone access.'
        : 'Microphone access is blocked. Enable it in device Settings → Apps → ShieldX → Permissions.'
    );
  }

  // Set audio mode for recording (required on Android and iOS)
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
  });

  recorder = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
  await recorder.prepareToRecordAsync();
  recorder.record();
}

/**
 * Stop recording and send the audio to the backend AI agent.
 * Returns both user + agent ChatMessage objects for the UI.
 */
export async function stopRecordingAndSend(
  sessionId: string
): Promise<{ userMsg: ChatMessage; agentMsg: ChatMessage }> {
  if (!recorder) throw new Error('No active recording');

  await recorder.stop();
  const uri = recorder.uri;
  recorder.release();
  recorder = null;

  if (!uri) throw new Error('Recording URI is null');

  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // expo-audio HIGH_QUALITY preset produces an m4a file on iOS/Android
  const { reply, transcript } = await chatApi.sendVoice({ 
    audio: base64, 
    mimeType: 'audio/m4a',
    sessionId 
  });

  const userMsg: ChatMessage = {
    id: uid(),
    role: 'user',
    content: transcript ?? '🎤 Voice message',
    transcript,
    isVoice: true,
    audioUri: uri,
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
