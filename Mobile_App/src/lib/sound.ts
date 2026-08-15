import { Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Trigger intense emergency dispatch hardware vibration sequence & deep alertful siren.
 * Plays when a mission is dispatched to the hero's wristband.
 */
export async function triggerEmergencyDispatchAlert() {
  try {
    // 1. Hardware Vibration Motor (Android & iOS Native)
    if (Platform.OS !== 'web') {
      // Hardware vibration motor pattern: [pause 0ms, vibrate 500ms, pause 200ms, vibrate 500ms, pause 200ms, vibrate 1000ms]
      Vibration.vibrate([0, 500, 200, 500, 200, 1000]);

      // Haptic Engine feedback
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    } else {
      // Web Browser Vibration API (Web simulator)
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate([400, 100, 400, 100, 400, 100, 800]);
      }
    }

    // 2. High-Alert Deep Tactical Siren & Dual-Tone Klaxon (Web Audio API)
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;

        // A. Deep Sub-Bass Emergency Alert Sweep (180Hz -> 55Hz deep boom drop)
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(180, now);
        bassOsc.frequency.exponentialRampToValueAtTime(55, now + 0.6);
        bassGain.gain.setValueAtTime(0.7, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.65);

        // B. Piercing High-Alert Emergency Klaxon Beeps (Alternating 950Hz & 1450Hz square tones)
        const playKlaxonPulse = (freq: number, startTime: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square'; // Sharp square wave for maximum loudness & alertness
          osc.frequency.setValueAtTime(freq, now + startTime);
          gain.gain.setValueAtTime(0.5, now + startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, now + startTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + startTime);
          osc.stop(now + startTime + duration);
        };

        // Dual-Tone High Priority Warning Sirens: 950Hz -> 1450Hz -> 950Hz -> 1450Hz -> 1800Hz
        playKlaxonPulse(950, 0.0, 0.15);
        playKlaxonPulse(1450, 0.16, 0.15);
        playKlaxonPulse(950, 0.32, 0.15);
        playKlaxonPulse(1450, 0.48, 0.15);
        playKlaxonPulse(1800, 0.64, 0.40);
      }
    }
  } catch (err) {
    console.warn('[AEGIS Sound] Emergency alert audio/vibration error:', err);
  }
}
