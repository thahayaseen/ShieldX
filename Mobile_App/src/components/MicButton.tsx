import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
        <View style={styles.recordingPulse}>
          <Text style={styles.pulseText}>TRANSMITTING...</Text>
        </View>
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
  },
  recordingPulse: {
    position: 'absolute',
    bottom: 54,
    backgroundColor: 'rgba(255, 82, 82, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  pulseText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  buttonIdle: {
    backgroundColor: '#161929',
    borderColor: AegisColors.accentBlue,
  },
  buttonRecording: {
    backgroundColor: 'rgba(255, 82, 82, 0.3)',
    borderColor: AegisColors.critical,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  icon: {
    fontSize: 18,
  },
});
