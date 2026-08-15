import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AegisColors } from '@/constants/theme';

interface MicButtonProps {
  onStartRecord: () => Promise<void>;
  onStopRecord: () => Promise<void>;
  disabled?: boolean;
}

export const MicButton: React.FC<MicButtonProps> = ({
  onStartRecord,
  onStopRecord,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);

  const handlePressIn = async () => {
    if (disabled) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setIsRecording(true);
      await onStartRecord();
    } catch (err) {
      console.error('Failed to start recording', err);
      setIsRecording(false);
    }
  };

  const handlePressOut = async () => {
    if (!isRecording) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      setIsRecording(false);
      await onStopRecord();
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsRecording(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      {isRecording && (
        <>
          {/* Audio Visualizer Pulse Rings */}
          <View style={styles.pulseRingOuter} />
          <View style={styles.pulseRingInner} />
          <View style={styles.recordingPulse}>
            <Text style={styles.pulseText}>🎙️ TRANSMITTING AUDIO TO A.E.G.I.S...</Text>
          </View>
        </>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          isRecording ? styles.buttonRecording : styles.buttonIdle,
          disabled && styles.buttonDisabled,
          Platform.OS === 'web' && isRecording
            ? ({ boxShadow: '0 0 20px rgba(255, 82, 82, 0.8), 0 0 40px rgba(255, 82, 82, 0.4)' } as any)
            : Platform.OS === 'web'
            ? ({ boxShadow: '0 0 12px rgba(79, 195, 247, 0.3)' } as any)
            : {},
        ]}>
        <Text style={styles.icon}>{isRecording ? '🔴' : '🎙️'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRingOuter: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255, 82, 82, 0.4)',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  pulseRingInner: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: 'rgba(255, 82, 82, 0.7)',
  },
  recordingPulse: {
    position: 'absolute',
    bottom: 58,
    backgroundColor: '#ff5252',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: '#ff5252',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  pulseText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 2,
  },
  buttonIdle: {
    backgroundColor: '#161929',
    borderColor: AegisColors.accentBlue,
  },
  buttonRecording: {
    backgroundColor: 'rgba(255, 82, 82, 0.9)',
    borderColor: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  icon: {
    fontSize: 20,
  },
});
