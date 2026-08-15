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
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.card,
        { borderLeftColor: priorityColor, borderColor: `${priorityColor}40` },
        Platform.OS === 'web'
          ? ({ boxShadow: `0 6px 20px ${priorityColor}20, 0 2px 8px rgba(0,0,0,0.6)` } as any)
          : {},
      ]}>
      {/* Top Corner Radar Marker */}
      <View style={[styles.cornerMarker, { borderColor: priorityColor }]} />

      <View style={styles.headerRow}>
        <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}18`, borderColor: `${priorityColor}80` }]}>
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {mission.priority.toUpperCase()} PRIORITY
          </Text>
        </View>
        <Text style={[styles.statusText, { color: priorityColor }]}>
          {mission.status.replace('_', ' ').toUpperCase()}
        </Text>
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
      {(mission.status === 'pending' || mission.status === 'dispatched') && (onAccept || onStatusChange) && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: AegisColors.accentBlue }]}
          onPress={() => (onAccept ? onAccept() : onStatusChange?.('accepted'))}
          activeOpacity={0.8}>
          <Text style={styles.actionBtnText}>⚡ ACCEPT MISSION ASSIGNMENT</Text>
        </TouchableOpacity>
      )}

      {mission.status === 'accepted' && onStatusChange && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: AegisColors.accentAmber }]}
          onPress={() => onStatusChange('en_route')}
          activeOpacity={0.8}>
          <Text style={[styles.actionBtnText, { color: '#0d0f1a' }]}>🚀 DEPLOY / EN ROUTE</Text>
        </TouchableOpacity>
      )}

      {mission.status === 'en_route' && onStatusChange && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: AegisColors.heroes.Thor }]}
          onPress={() => onStatusChange('arrived')}
          activeOpacity={0.8}>
          <Text style={styles.actionBtnText}>📍 ARRIVED AT TACTICAL SCENE</Text>
        </TouchableOpacity>
      )}

      {mission.status === 'arrived' && onStatusChange && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: AegisColors.success }]}
          onPress={() => onStatusChange('complete')}
          activeOpacity={0.8}>
          <Text style={[styles.actionBtnText, { color: '#0d0f1a' }]}>✅ MARK MISSION COMPLETE</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: AegisColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cornerMarker: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: AegisColors.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 12,
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
    fontSize: 11,
    color: AegisColors.accentBlue,
    fontWeight: '700',
  },
  heroText: {
    fontSize: 11,
    color: AegisColors.accentAmber,
    fontWeight: '800',
  },
  powersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  powerPill: {
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
    borderColor: 'rgba(79, 195, 247, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  powerText: {
    fontSize: 9,
    color: AegisColors.accentBlue,
    fontWeight: '700',
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },
});
