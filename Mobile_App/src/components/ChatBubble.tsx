import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { AegisColors } from '@/constants/theme';
import type { ChatMessage } from '@/types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.agentContainer]}>
      {!isUser && (
        <View style={styles.agentAvatar}>
          <Text style={styles.agentAvatarText}>🛡️</Text>
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.userBubble : styles.agentBubble]}>
        {message.isVoice && (
          <View style={styles.voiceHeader}>
            <Text style={styles.voiceIcon}>🎙️</Text>
            <Text style={styles.voiceLabel}>VOICE TRANSMISSION</Text>
          </View>
        )}

        {isUser ? (
          <Text style={styles.userText}>{message.content}</Text>
        ) : (
          <Markdown style={markdownStyles}>
            {message.content}
          </Markdown>
        )}

        {message.transcript && (
          <Text style={styles.transcriptSubtext}>Transcript: "{message.transcript}"</Text>
        )}

        <Text style={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 8,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  agentContainer: {
    justifyContent: 'flex-start',
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e2235',
    borderWidth: 1,
    borderColor: AegisColors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  agentAvatarText: {
    fontSize: 14,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
    borderColor: 'rgba(79, 195, 247, 0.4)',
    borderBottomRightRadius: 2,
  },
  agentBubble: {
    backgroundColor: AegisColors.surface,
    borderColor: AegisColors.border,
    borderBottomLeftRadius: 2,
  },
  userText: {
    color: AegisColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  voiceIcon: {
    fontSize: 12,
  },
  voiceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: AegisColors.accentBlue,
    letterSpacing: 0.5,
  },
  transcriptSubtext: {
    fontSize: 11,
    fontStyle: 'italic',
    color: AegisColors.textMuted,
    marginTop: 6,
  },
  timestamp: {
    fontSize: 9,
    color: AegisColors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});

const markdownStyles = {
  body: {
    color: AegisColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  code_inline: {
    backgroundColor: '#0d0f1a',
    color: AegisColors.accentBlue,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  bullet_list: {
    marginVertical: 4,
  },
  strong: {
    fontWeight: 'bold' as const,
    color: AegisColors.accentBlue,
  },
};
