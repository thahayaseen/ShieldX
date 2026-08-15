import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AegisColors, getStatusColor } from '@/constants/theme';
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
        { borderColor: `${color}40`, backgroundColor: `${color}15` },
      ]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
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
    borderRadius: 12,
    borderWidth: 1,
  },
  pillSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  pillMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});
