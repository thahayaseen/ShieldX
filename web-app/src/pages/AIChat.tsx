import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendTextMessage, SUGGESTED_PROMPTS } from '../lib/chat';
import type { ChatMessage } from '../types';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'agent',
    content:
      '**A.E.G.I.S. Command Terminal Online.**\n\nMCP Model Context Protocol connection established with Supabase.\n\nYou may query real-time hero readiness, active emergencies, or request system status summaries.',
    timestamp: new Date().toISOString(),
  },
];

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryToSend?: string) => {
    const query = queryToSend || inputText.trim();
    if (!query || loading) return;

    setInputText('');
    setLoading(true);

    try {
      const { userMsg, agentMsg } = await sendTextMessage(query);
      setMessages((prev) => [...prev, userMsg, agentMsg]);
    } catch {
      // Mock MCP query reply if backend isn't online
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date().toISOString(),
      };

      let reply = 'A.E.G.I.S. simulation response: All systems nominal across Calicut defense sectors.';
      if (query.toLowerCase().includes('building') || query.toLowerCase().includes('collapse')) {
        reply = 'MCP Query `get_hero_assignment`: **Hulk** is assigned to the **Building Collapse** in Calicut City Center. Mission status is **Active**.';
      } else if (query.toLowerCase().includes('thor')) {
        reply = "MCP Query `get_hero_status`: **Thor** is currently **On Mission** at Beypore Port neutralizing an electrical energy anomaly.";
      } else if (query.toLowerCase().includes('available') || query.toLowerCase().includes('heroes')) {
        reply = 'MCP Query `get_hero_status`: Available heroes:\n- **Spider-Man** (Sector 4)\n- **Iron Man** (NH66 Bypass)\n- **Captain America** (Standby)';
      }

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, agentMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>MCP NATURAL LANGUAGE CONSOLE</h1>
          <p style={styles.subtitle}>QUERY SYSTEM DATA & TELEMETRY VIA MODEL CONTEXT PROTOCOL</p>
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
                    <span style={styles.userText}>{m.content}</span>
                  ) : (
                    <div style={styles.markdownWrapper}>
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                  <span style={styles.timestamp}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={styles.loadingRow}>
              <span style={{ fontSize: '14px' }}>⚡</span>
              <span style={styles.loadingText}>A.E.G.I.S. EXECUTING MCP TOOL QUERY...</span>
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

        {/* Input Row */}
        <form
          style={styles.inputForm}
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}>
          <input
            type="text"
            placeholder="Type your natural language command (e.g. 'What is Spider-Man's status?')..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={styles.input}
          />
          <button type="submit" className="hud-btn hud-btn-primary" disabled={loading}>
            TRANSMIT ➤
          </button>
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
    gap: '8px',
    padding: '10px',
    backgroundColor: '#131b31',
    borderRadius: '6px',
    width: 'fit-content',
  },
  loadingText: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#00d4ff',
    letterSpacing: '0.5px',
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
  },
  input: {
    flex: 1,
    backgroundColor: '#060810',
    border: '1px solid #1e2b4d',
    borderRadius: '6px',
    padding: '10px 14px',
    color: '#f0f4fc',
    fontSize: '13px',
  },
};
