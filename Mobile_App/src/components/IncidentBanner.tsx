import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AegisColors } from '@/constants/theme';
import type { Mission } from '@/types';

interface IncidentBannerProps {
  mission: Mission | null;
  visible: boolean;
  onAccept: (mission: Mission) => void;
  onDismiss: () => void;
}

export const IncidentBanner: React.FC<IncidentBannerProps> = ({
  mission,
  visible,
  onAccept,
  onDismiss,
}) => {
  useEffect(() => {
    if (visible) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // Haptics might fail on non-supported devices / simulator
      }
    }
  }, [visible]);

  if (!mission) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.alertCard}>
          <View style={styles.header}>
            <View style={styles.alertPulse}>
              <Text style={styles.alertIcon}>🚨</Text>
            </View>
            <View>
              <Text style={styles.alertBadge}>CRITICAL DISPATCH</Text>
              <Text style={styles.timeTag}>A.E.G.I.S. PRIORITY OVERRIDE</Text>
            </View>
          </View>

          <Text style={styles.title}>{mission.title}</Text>
          <Text style={styles.location}>📍 Location: {mission.location.label || 'Designated Sector'}</Text>
          {mission.description ? (
            <Text style={styles.description}>{mission.description}</Text>
          ) : null}

          {mission.requiredPowers && (
            <View style={styles.powersContainer}>
              <Text style={styles.powersLabel}>REQUIRED ABILITIES:</Text>
              <View style={styles.powerPills}>
                {mission.requiredPowers.map((p, i) => (
                  <View key={i} style={styles.powerBadge}>
                    <Text style={styles.powerText}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={styles.dismissBtnText}>STANDBY</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => onAccept(mission)}>
              <Text style={styles.acceptBtnText}>ACCEPT MISSION</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#161929',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: AegisColors.critical,
    padding: 20,
    shadowColor: AegisColors.critical,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  alertPulse: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 82, 82, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AegisColors.critical,
  },
  alertIcon: {
    fontSize: 20,
  },
  alertBadge: {
    fontSize: 16,
    fontWeight: '900',
    color: AegisColors.critical,
    letterSpacing: 1,
  },
  timeTag: {
    fontSize: 10,
    color: AegisColors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: AegisColors.textPrimary,
    marginBottom: 6,
  },
  location: {
    fontSize: 13,
    color: AegisColors.accentAmber,
    fontWeight: '700',
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    color: AegisColors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  powersContainer: {
    marginBottom: 20,
  },
  powersLabel: {
    fontSize: 10,
    color: AegisColors.textMuted,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  powerPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  powerBadge: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  powerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ff8a80',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dismissBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AegisColors.border,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: AegisColors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: AegisColors.critical,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
});
