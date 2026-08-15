import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { getStatusColor } from '@/constants/theme';
import type { HeroStatus } from '@/types';

interface StatusPillProps {
  status: HeroStatus;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, size = 'md' }) => {
  const color = getStatusColor(status);
  const label = status.replace('_', ' ').toUpperCase();

  return (
    <View
      style={[
        styles.pill,
        size === 'sm' ? styles.pillSm : styles.pillMd,
        { borderColor: `${color}60`, backgroundColor: `${color}18` },
        Platform.OS === 'web' ? ({ boxShadow: `0 0 12px ${color}35` } as any) : {},
      ]}>
      <View style={styles.dotContainer}>
        <View style={[styles.dotPulse, { backgroundColor: color }]} />
        <View style={[styles.dotCore, { backgroundColor: color }]} />
      </View>
      <Text style={[styles.text, size === 'sm' ? styles.textSm : styles.textMd, { color }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  pillSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  pillMd: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 7,
  },
  dotContainer: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotPulse: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.35,
  },
  dotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  textSm: {
    fontSize: 9,
  },
  textMd: {
    fontSize: 11,
  },
});
