// A.E.G.I.S. – Chat Helpers (web-app)
import { chatApi } from './api';
import type { ChatMessage } from '../types';

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function sendTextMessage(
  userText: string,
  sessionId?: string
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

export const SUGGESTED_PROMPTS = [
  'Which hero is assigned to the current mission?',
  'Any breaking emergencies right now?',
  "What is Thor's current status?",
  'Give me a full system overview',
  'Show all available heroes',
] as const;
