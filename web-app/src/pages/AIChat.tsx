import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendToVoiceAgent, sendAudioToVoiceAgent, speakText, SUGGESTED_PROMPTS } from '../lib/chat';
import type { ChatMessage } from '../types';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'agent',
    content:
      '**A.E.G.I.S. Command Terminal Online.**\n\nLive Supabase Voice-Agent connected. Natural language and voice queries active.\n\nSpeak into the mic or type a command — I will respond with text and voice.',
    timestamp: new Date().toISOString(),
  },
];

// Minimal type augmentation for SpeechRecognition (browser-vendor prefixed)
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const checkSpeaking = setInterval(() => {
      setIsSpeaking(window.speechSynthesis?.speaking || false);
    }, 300);
    return () => clearInterval(checkSpeaking);
  }, []);

  const handleSend = useCallback(
    async (queryToSend?: string) => {
      const query = (queryToSend || inputText).trim();
      console.log('[AEGIS Chat] handleSend invoked with query:', query);
      if (!query || loading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date().toISOString(),
      };

      // Instantly show user message in chat log
      console.log('[AEGIS Chat] Optimistically adding user message to state:', userMsg);
      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setTranscript('');
      setLoading(true);

      try {
        console.log('[AEGIS Chat] Sending request to voice agent...');
        const reply = await sendToVoiceAgent(query);
        console.log('[AEGIS Chat] Received reply from voice agent:', reply);
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: reply,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, agentMsg]);
        if (voiceEnabled) speakText(reply);
      } catch (err) {
        console.error('[AEGIS Chat] sendToVoiceAgent error:', err);
        const errorMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: `⚠️ **Agent offline.** Could not reach Supabase voice-agent endpoint.\n\nPlease check your network or Supabase function status.`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [inputText, loading, voiceEnabled]
  );

  const stopAndSendVoice = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    mediaRecorderRef.current.onstop = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsListening(false);
      setTranscript('');

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        if (!base64Data) return;

        const audioUrl = URL.createObjectURL(audioBlob);

        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: '🎤 *[Voice Query Command]*',
          timestamp: new Date().toISOString(),
          audioUrl,
        };

        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
          console.log('[AEGIS Chat] Transmitting audio base64 query to Supabase voice-agent...');
          const reply = await sendAudioToVoiceAgent(base64Data, 'audio/webm');
          console.log('[AEGIS Chat] Voice agent reply received:', reply);

          const agentMsg: ChatMessage = {
            id: `agent-${Date.now()}`,
            role: 'agent',
            content: reply,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, agentMsg]);
          if (voiceEnabled) speakText(reply);
        } catch (err) {
          console.error('[AEGIS Chat] Voice agent submission error:', err);
          const errorMsg: ChatMessage = {
            id: `agent-${Date.now()}`,
            role: 'agent',
            content: '⚠️ **Agent offline.** Could not process or send voice message to Supabase edge function.',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        } finally {
          setLoading(false);
        }
      };
    };

    mediaRecorderRef.current.stop();
  }, [voiceEnabled]);

  const startVoiceInput = useCallback(async () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsListening(false);
      setTranscript('');
      return;
    }

    try {
      window.speechSynthesis?.cancel();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsListening(true);
        setTranscript('Recording audio query...');
      };

      mediaRecorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        setIsListening(false);
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('[AEGIS Voice] MediaRecorder start error:', err);
      alert('Could not access microphone. Please ensure microphone permissions are granted.');
    }
  }, [isListening]);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>A.E.G.I.S. VOICE COMMAND CONSOLE</h1>
          <p style={styles.subtitle}>NATURAL LANGUAGE & VOICE QUERY — LIVE SUPABASE AI AGENT</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isSpeaking && (
            <button
              style={styles.iconBtn}
              onClick={stopSpeaking}
              title="Stop audio playback">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffd54f" strokeWidth="2.5" strokeLinecap="round">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              </svg>
            </button>
          )}
          <button
            style={{
              ...styles.iconBtn,
              borderColor: voiceEnabled ? 'rgba(0,230,118,0.5)' : 'rgba(77,92,128,0.5)',
            }}
            onClick={() => {
              setVoiceEnabled((v) => !v);
              if (isSpeaking) stopSpeaking();
            }}
            title={voiceEnabled ? 'Mute agent responses' : 'Unmute agent responses'}>
            {voiceEnabled ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4d5c80" strokeWidth="2.5" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="hud-panel" style={styles.chatPanel}>
        {/* Message Log */}
        <div style={styles.messageList}>
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                style={{
                  ...styles.messageRow,
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}>
                {!isUser && <div style={styles.agentIcon}>🛡️</div>}
                <div
                  style={{
                    ...styles.bubble,
                    ...(isUser ? styles.userBubble : styles.agentBubble),
                  }}>
                  {isUser ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={styles.userText}>{m.content}</span>
                      {m.audioUrl && (
                        <div style={styles.audioContainer}>
                          <audio src={m.audioUrl} controls style={styles.audioPlayer} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={styles.markdownWrapper}>
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                  <span style={styles.timestamp}>
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={styles.loadingRow}>
              <div style={styles.loadingDots}>
                <span style={{ ...styles.dot, animationDelay: '0ms' }} />
                <span style={{ ...styles.dot, animationDelay: '160ms' }} />
                <span style={{ ...styles.dot, animationDelay: '320ms' }} />
              </div>
              <span style={styles.loadingText}>A.E.G.I.S. QUERYING LIVE DATABASE...</span>
            </div>
          )}

          {isListening && (
            <div style={styles.listeningRow}>
              <span style={styles.micPulse}>🎙️</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={styles.listeningText}>
                  {transcript ? `"${transcript}"` : 'LISTENING... SPEAK YOUR COMMAND'}
                </span>
                {!transcript && (
                  <span style={{ fontSize: '10px', color: '#4d5c80' }}>
                    Mic is open — click ➤ to send when done.
                  </span>
                )}
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Suggested Queries */}
        <div style={styles.promptsRow}>
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              className="hud-btn"
              style={{ fontSize: '11px', padding: '4px 10px' }}
              onClick={() => handleSend(prompt)}>
              {prompt}
            </button>
          ))}
        </div>

        <form
          style={styles.inputForm}
          onSubmit={(e) => {
            e.preventDefault();
            if (!isListening) handleSend();
          }}>

          {/* Mic toggle icon */}
          <button
            type="button"
            style={{
              ...styles.iconBtn,
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: isListening ? 'rgba(255,56,96,0.2)' : 'rgba(0,212,255,0.06)',
              borderColor: isListening ? '#ff3860' : '#1e2b4d',
              boxShadow: isListening ? '0 0 18px rgba(255,56,96,0.55)' : 'none',
              flexShrink: 0,
            }}
            onClick={startVoiceInput}
            title={isListening ? 'Cancel recording' : 'Start voice input'}>
            {isListening ? (
              /* stop/cancel square */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff3860">
                <rect x="4" y="4" width="16" height="16" rx="3" />
              </svg>
            ) : (
              /* microphone */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>

          <input
            type="text"
            placeholder={
              isListening
                ? 'Listening — say your command...'
                : "Ask anything — 'What are the active missions right now?'"
            }
            value={isListening ? transcript : inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              ...styles.input,
              borderColor: isListening ? 'rgba(255,56,96,0.45)' : '#1e2b4d',
            }}
            disabled={isListening}
          />

          {/* Send icon — paper-plane when typing, lightning bolt when listening */}
          {isListening ? (
            <button
              type="button"
              style={{
                ...styles.iconBtn,
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 56, 96, 0.2)',
                borderColor: '#ff3860',
                flexShrink: 0,
              }}
              onClick={stopAndSendVoice}
              disabled={loading}
              title="Send voice command">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff3860" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              style={{
                ...styles.iconBtn,
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                backgroundColor: inputText.trim() ? 'rgba(0,212,255,0.15)' : 'rgba(77,92,128,0.1)',
                borderColor: inputText.trim() ? '#00d4ff' : '#1e2b4d',
                flexShrink: 0,
              }}
              onClick={(e) => {
                e.preventDefault();
                handleSend();
              }}
              disabled={loading || !inputText.trim()}
              title="Send message">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={inputText.trim() ? '#00d4ff' : '#4d5c80'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    height: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '18px',
    fontWeight: 900,
    letterSpacing: '1px',
    color: '#00d4ff',
    margin: 0,
  },
  subtitle: {
    fontSize: '11px',
    color: '#8493b2',
    letterSpacing: '0.8px',
    margin: '4px 0 0 0',
  },
  chatPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 160px)',
    padding: '16px',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    paddingRight: '8px',
  },
  messageRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
  agentIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    backgroundColor: '#131b31',
    border: '1px solid #00d4ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  userBubble: {
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    borderColor: 'rgba(0, 212, 255, 0.35)',
    borderBottomRightRadius: '2px',
  },
  agentBubble: {
    backgroundColor: '#131b31',
    borderColor: '#1e2b4d',
    borderBottomLeftRadius: '2px',
  },
  userText: {
    fontSize: '13px',
    color: '#f0f4fc',
  },
  markdownWrapper: {
    fontSize: '13px',
    color: '#f0f4fc',
    lineHeight: '18px',
  },
  timestamp: {
    fontSize: '9px',
    color: '#4d5c80',
    alignSelf: 'flex-end',
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    backgroundColor: '#131b31',
    borderRadius: '6px',
    width: 'fit-content',
  },
  loadingDots: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#00d4ff',
    display: 'inline-block',
    animation: 'aegisPulse 1s infinite',
  },
  loadingText: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#00d4ff',
    letterSpacing: '0.5px',
  },
  listeningRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    backgroundColor: 'rgba(255, 56, 96, 0.08)',
    border: '1px solid rgba(255, 56, 96, 0.3)',
    borderRadius: '6px',
    width: 'fit-content',
  },
  micPulse: {
    fontSize: '18px',
    animation: 'aegisPulse 0.8s infinite',
  },
  listeningText: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#ff3860',
    letterSpacing: '0.5px',
    fontStyle: 'italic',
  },
  promptsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '12px 0',
    borderTop: '1px solid #1e2b4d',
  },
  inputForm: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  micBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },
  iconBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 27, 49, 0.9)',
    border: '1px solid #1e2b4d',
    transition: 'all 0.2s ease',
    outline: 'none',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    backgroundColor: '#060810',
    border: '1px solid',
    borderRadius: '6px',
    padding: '10px 14px',
    color: '#f0f4fc',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  audioContainer: {
    marginTop: '6px',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: 'rgba(5, 7, 15, 0.4)',
    border: '1px solid rgba(0, 212, 255, 0.25)',
    padding: '4px',
  },
  audioPlayer: {
    width: '100%',
    height: '32px',
    outline: 'none',
  },
};
