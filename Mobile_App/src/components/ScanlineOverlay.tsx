import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

/**
 * Dispatch-inspired CRT Scanline & Radar HUD Overlay.
 * Adds retro-futuristic screen scanlines, CRT vignette, and tactical grid lines.
 */
export const ScanlineOverlay: React.FC = () => {
  return (
    <View style={[styles.container, Platform.OS === 'web' ? ({ pointerEvents: 'none' } as any) : {}]} pointerEvents="none">
      <View style={styles.vignette} />
      <View style={styles.gridLine} />
      <View style={styles.radarCornerTopLeft} />
      <View style={styles.radarCornerTopRight} />
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
    backgroundColor: 'rgba(5, 7, 15, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.12)',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.04,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web'
      ? {
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4) 1px, transparent 1px, transparent 3px)',
        }
      : {}),
  },
  radarCornerTopLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(79, 195, 247, 0.4)',
  },
  radarCornerTopRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(79, 195, 247, 0.4)',
  },
});
