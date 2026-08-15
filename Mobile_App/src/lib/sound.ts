import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Play emergency dispatch chime beep sound and heavy haptic vibration pattern.
 * Triggered when a new mission is assigned/dispatched to the active hero.
 */
export async function triggerEmergencyDispatchAlert() {
  try {
    // 1. Haptic Vibration pattern
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 200);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 400);
    } else {
      // Browser Vibration API for web simulator
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
    }

    // 2. Tactical Emergency Audio Beep Chime (Synthesized Web Audio API)
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const playBeep = (freq: number, startTime: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
          gain.gain.setValueAtTime(0.35, ctx.currentTime + startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + startTime);
          osc.stop(ctx.currentTime + startTime + duration);
        };

        // Tactical 3-tone emergency dispatch alert chime: 880Hz -> 1174Hz -> 1760Hz
        playBeep(880, 0, 0.14);
        playBeep(1174, 0.16, 0.14);
        playBeep(1760, 0.32, 0.35);
      }
    }
  } catch (err) {
    console.warn('[AEGIS Sound] Emergency alert audio/vibration error:', err);
  }
}
