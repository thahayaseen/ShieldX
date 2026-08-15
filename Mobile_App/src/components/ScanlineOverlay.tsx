import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

/**
 * Dispatch-inspired Scanline & CRT Vignette Overlay.
 * Adds subtle retro-futuristic CRT screen lines and dark atmosphere.
 */
export const ScanlineOverlay: React.FC = () => {
  return (
    <View style={[styles.container, Platform.OS === 'web' ? ({ pointerEvents: 'none' } as any) : {}]} pointerEvents="none">
      <View style={styles.vignette} />
      <View style={styles.gridLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 999,
  },
  vignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 7, 15, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.08)',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.03,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web'
      ? {
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35) 1px, transparent 1px, transparent 2px)',
        }
      : {}),
  },
});
