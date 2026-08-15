import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { AegisColors } from '@/constants/theme';
import { ScanlineOverlay } from '@/components/ScanlineOverlay';
import { ChatBubble } from '@/components/ChatBubble';
import { MicButton } from '@/components/MicButton';
import {
  sendTextMessage,
  startRecording,
  stopRecordingAndSend,
  SUGGESTED_PROMPTS,
} from '@/lib/chat';
import type { ChatMessage } from '@/types';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'agent',
    content:
      '**A.E.G.I.S. Guardian Intelligence Online.**\n\nI have access to real-time incident telemetry, hero readiness boards, and mission dispatch logs via MCP.\n\nAsk me any operational query or press the mic to transmit.',
    timestamp: new Date().toISOString(),
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [voicePlaybackEnabled, setVoicePlaybackEnabled] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const sessionId = 'hero-session-spider';

  const speakReply = (text: string) => {
    if (!voicePlaybackEnabled) return;
    try {
      // Strip markdown asterisks for cleaner speech
      const cleanText = text.replace(/[*#_`]/g, '');
      Speech.stop();
      Speech.speak(cleanText, { rate: 1.0, pitch: 1.0 });
    } catch {
      // TTS not available
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText.trim();
    if (!query || loading) return;

    setInputText('');
    setLoading(true);

    try {
      const { userMsg, agentMsg } = await sendTextMessage(query, sessionId);
      setMessages((prev) => [...prev, userMsg, agentMsg]);
      speakReply(agentMsg.content);
    } catch (err: any) {
      console.warn('Text send failed:', err);
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date().toISOString(),
      };
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'agent',
        content: `⚠️ **Connection Error:** Failed to reach A.E.G.I.S. Core. (${err.message || 'Unknown error'})`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg, errMsg]);
      speakReply("Connection to AEGIS core failed.");
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleStartRecord = async () => {
    try {
      await startRecording();
    } catch (err: any) {
      // Surface permission errors as a chat message so the user sees them
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'agent',
        content: `⚠️ **Mic Error:** ${err.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  const handleStopRecord = async () => {
    setLoading(true);
    try {
      const { userMsg, agentMsg } = await stopRecordingAndSend(sessionId);
      setMessages((prev) => [...prev, userMsg, agentMsg]);
      speakReply(agentMsg.content);
    } catch (err: any) {
      console.warn('Voice send failed:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'agent',
        content: `⚠️ **Transmission Error:** Voice packet rejected by A.E.G.I.S. Core. (${err.message || 'Unknown error'})`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
      speakReply("Voice transmission failed.");
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScanlineOverlay />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>A.E.G.I.S. // AI COMMS</Text>
          <Text style={styles.subtitle}>NATURAL LANGUAGE MCP DISPATCH AGENT</Text>
        </View>

        <TouchableOpacity
          style={[styles.ttsToggle, voicePlaybackEnabled && styles.ttsToggleActive]}
          onPress={() => setVoicePlaybackEnabled(!voicePlaybackEnabled)}>
          <Text style={styles.ttsText}>{voicePlaybackEnabled ? '🔊 VOICE ON' : '🔇 MUTED'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}

          {loading && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator color={AegisColors.accentBlue} size="small" />
              <Text style={styles.loadingText}>A.E.G.I.S. QUERYING MCP PROTOCOL...</Text>
            </View>
          )}
        </ScrollView>

        {/* Suggested Prompts Bar */}
        <View style={styles.promptsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsScroll}>
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.promptPill}
                onPress={() => handleSend(prompt)}>
                <Text style={styles.promptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask A.E.G.I.S. intelligence..."
            placeholderTextColor={AegisColors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />

          {inputText.trim().length > 0 ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => handleSend()}
              disabled={loading}>
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          ) : (
            <MicButton
              onStartRecord={handleStartRecord}
              onStopRecord={handleStopRecord}
              disabled={loading}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AegisColors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AegisColors.border,
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: AegisColors.textPrimary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 9,
    color: AegisColors.accentBlue,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  ttsToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AegisColors.border,
    backgroundColor: AegisColors.surface,
  },
  ttsToggleActive: {
    borderColor: AegisColors.accentBlue,
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
  },
  ttsText: {
    fontSize: 10,
    fontWeight: '800',
    color: AegisColors.textSecondary,
  },
  chatArea: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AegisColors.surface,
    padding: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: AegisColors.border,
  },
  loadingText: {
    fontSize: 11,
    color: AegisColors.accentBlue,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  promptsContainer: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: AegisColors.border,
    backgroundColor: 'rgba(22, 25, 41, 0.6)',
  },
  promptsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  promptPill: {
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  promptText: {
    fontSize: 11,
    color: AegisColors.accentBlue,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    alignItems: 'center',
    backgroundColor: AegisColors.surface,
    borderTopWidth: 1,
    borderTopColor: AegisColors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0d0f1a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: AegisColors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: AegisColors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AegisColors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 16,
    color: '#0d0f1a',
    fontWeight: '900',
  },
});
