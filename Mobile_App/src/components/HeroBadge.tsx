import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { AegisColors, getHeroBrandColor } from '@/constants/theme';
import { StatusPill } from './StatusPill';
import type { Hero } from '@/types';

interface HeroBadgeProps {
  hero: Hero;
  showStatus?: boolean;
}

export const HeroBadge: React.FC<HeroBadgeProps> = ({ hero, showStatus = true }) => {
  const brandColor = hero.brandColor || getHeroBrandColor(hero.codename);
  const initials = hero.codename
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatarRing,
          { borderColor: brandColor },
          Platform.OS === 'web'
            ? ({ boxShadow: `0 0 10px ${brandColor}80` } as any)
            : { shadowColor: brandColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
        ]}>
        <View style={[styles.avatarInner, { backgroundColor: `${brandColor}25` }]}>
          <Text style={[styles.initials, { color: brandColor }]}>{initials}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.codename}>{hero.codename}</Text>
        <Text style={styles.realName}>{hero.name}</Text>
      </View>
      {showStatus && <StatusPill status={hero.status} size="sm" />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  info: {
    flex: 1,
  },
  codename: {
    fontSize: 15,
    fontWeight: '800',
    color: AegisColors.textPrimary,
    letterSpacing: 0.5,
  },
  realName: {
    fontSize: 12,
    color: AegisColors.textSecondary,
    marginTop: 1,
  },
});
