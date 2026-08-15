import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AegisColors, getPriorityColor } from '@/constants/theme';
import type { Mission } from '@/types';

interface MissionCardProps {
  mission: Mission;
  onPress?: () => void;
  onAccept?: () => void;
  onStatusChange?: (status: Mission['status']) => void;
}

export const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  onPress,
  onAccept,
  onStatusChange,
}) => {
  const priorityColor = getPriorityColor(mission.priority);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        { borderLeftColor: priorityColor },
        Platform.OS === 'web' ? ({ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' } as any) : {},
      ]}>
      <View style={styles.headerRow}>
        <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20`, borderColor: `${priorityColor}60` }]}>
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {mission.priority.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.statusText}>{mission.status.replace('_', ' ').toUpperCase()}</Text>
      </View>

      <Text style={styles.title}>{mission.title}</Text>
      {mission.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {mission.description}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.locationText}>📍 {mission.location.label || 'Unknown Sector'}</Text>
        {mission.assignedHero && (
          <Text style={styles.heroText}>⚡ {mission.assignedHero.codename}</Text>
        )}
      </View>

      {mission.requiredPowers && mission.requiredPowers.length > 0 && (
        <View style={styles.powersRow}>
          {mission.requiredPowers.map((power, idx) => (
            <View key={idx} style={styles.powerPill}>
              <Text style={styles.powerText}>{power}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Quick Action buttons */}
      {mission.status === 'pending' && onAccept && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: AegisColors.accentBlue }]}
          onPress={onAccept}>
          <Text style={styles.actionBtnText}>⚡ ACCEPT MISSION</Text>
        </TouchableOpacity>
      )}

      {mission.status === 'accepted' && onStatusChange && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: AegisColors.accentAmber }]}
          onPress={() => onStatusChange('en_route')}>
          <Text style={[styles.actionBtnText, { color: '#0d0f1a' }]}>🚀 EN ROUTE</Text>
        </TouchableOpacity>
      )}

      {mission.status === 'en_route' && onStatusChange && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: AegisColors.heroes.Thor }]}
          onPress={() => onStatusChange('arrived')}>
          <Text style={styles.actionBtnText}>📍 ARRIVED AT SCENE</Text>
        </TouchableOpacity>
      )}

      {mission.status === 'arrived' && onStatusChange && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: AegisColors.success }]}
          onPress={() => onStatusChange('complete')}>
          <Text style={[styles.actionBtnText, { color: '#0d0f1a' }]}>✅ COMPLETE MISSION</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: AegisColors.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: AegisColors.border,
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 3,
        }
      : {}),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: AegisColors.textSecondary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: AegisColors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: AegisColors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: AegisColors.accentBlue,
    fontWeight: '600',
  },
  heroText: {
    fontSize: 12,
    color: AegisColors.accentAmber,
    fontWeight: '700',
  },
  powersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  powerPill: {
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
    borderColor: 'rgba(79, 195, 247, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  powerText: {
    fontSize: 10,
    color: AegisColors.accentBlue,
    fontWeight: '600',
  },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
});
