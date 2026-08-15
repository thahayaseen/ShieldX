import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { AegisColors, getHeroBrandColor } from '@/constants/theme';
import { ScanlineOverlay } from '@/components/ScanlineOverlay';
import { MissionCard } from '@/components/MissionCard';
import { StatusPill } from '@/components/StatusPill';
import { IncidentBanner } from '@/components/IncidentBanner';
import { MicButton } from '@/components/MicButton';
import { onSocketEvent } from '@/lib/socket';
import { heroesApi, missionsApi } from '@/lib/api';
import {
  updateHeroStatusInSupabase,
  updateMissionStatusInSupabase,
  fetchMissionsFromSupabase,
  formatSupabaseMission,
  subscribeToTable,
} from '@/lib/supabase';
import { triggerEmergencyDispatchAlert } from '@/lib/sound';
import { useAuth } from '@/context/AuthContext';
import type { Hero, Mission, HeroStatus } from '@/types';

import { ALL_HEROES } from '@/constants/heroes';

export default function HeroDashboard() {
  const { hero: authHero, userEmail, userName, userAvatar, clearanceLevel, logout } = useAuth();
  const activeHero = authHero || ALL_HEROES[0];

  const [heroModalVisible, setHeroModalVisible] = useState(false);
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [incomingMission, setIncomingMission] = useState<Mission | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const brandColor = activeHero.brandColor || getHeroBrandColor(activeHero.codename);

  const fetchLiveState = async () => {
    try {
      const liveMissions = await fetchMissionsFromSupabase();
      if (liveMissions && liveMissions.length > 0) {
        setActiveMissions(liveMissions);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchLiveState();

    const unsubMission = onSocketEvent('mission:assigned', ({ mission }) => {
      const isForActiveHero =
        mission.assignedHeroId === activeHero.id ||
        mission.assignedHero?.codename?.toLowerCase() === activeHero.codename?.toLowerCase();

      if (isForActiveHero) {
        triggerEmergencyDispatchAlert();
        setIncomingMission(mission);
        setAlertVisible(true);
        setActiveMissions((prev) => [mission, ...prev.filter((m) => m.id !== mission.id)]);
      }
    });

    const unsubStatus = onSocketEvent('mission:statusChanged', ({ missionId, status }) => {
      setActiveMissions((prev) =>
        prev.map((m) => (m.id === missionId ? { ...m, status } : m))
      );
    });

    const unsubRealtimeMissions = subscribeToTable('missions', '*', (payload) => {
      if (payload.new) {
        const raw: any = payload.new;
        const newMission = formatSupabaseMission(raw);
        const isForThisHero =
          raw.assigned_hero_id === activeHero.id ||
          raw.assignedHeroId === activeHero.id;

        if (isForThisHero) {
          triggerEmergencyDispatchAlert();
          setIncomingMission(newMission);
          setAlertVisible(true);
        }

        setActiveMissions((prev) => [
          newMission,
          ...prev.filter((m) => m.id !== newMission.id),
        ]);
      }
    });

    return () => {
      unsubMission();
      unsubStatus();
      unsubRealtimeMissions.unsubscribe();
    };
  }, [activeHero.id, activeHero.codename]);

  const handleStatusToggle = async (nextStatus: HeroStatus) => {
    try {
      await updateHeroStatusInSupabase(activeHero.id, nextStatus);
    } catch {}
  };

  const handleAcceptMission = async (mission: Mission) => {
    setAlertVisible(false);
    setIncomingMission(null);
    try {
      await updateMissionStatusInSupabase(mission.id, 'accepted', activeHero.id);
    } catch {}
    setActiveMissions((prev) =>
      prev.map((m) => (m.id === mission.id ? { ...m, status: 'accepted', assignedHeroId: activeHero.id } : m))
    );
  };

  const handleMissionStatusChange = async (missionId: string, status: Mission['status']) => {
    try {
      await updateMissionStatusInSupabase(missionId, status, activeHero.id);
    } catch {}
    setActiveMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, status, assignedHeroId: activeHero.id } : m))
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLiveState();
    setRefreshing(false);
  };

  // Missions assigned specifically to this authenticated hero OR unassigned general broadcasts
  const assignedToActiveHero = activeMissions.filter((m) => {
    if (!m) return false;
    const matchesId = m.assignedHeroId === activeHero.id;
    const matchesCodename =
      m.assignedHero?.codename?.toLowerCase() === activeHero.codename?.toLowerCase();
    const isUnassigned = !m.assignedHeroId;
    return matchesId || matchesCodename || isUnassigned;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScanlineOverlay />

      <IncidentBanner
        visible={alertVisible}
        mission={incomingMission}
        onAccept={handleAcceptMission}
        onDismiss={() => setAlertVisible(false)}
      />

      {/* Clearance Info Modal — read-only, identity locked to Google account */}
      <Modal visible={heroModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🛡️ OPERATIVE CLEARANCE RECORD</Text>
              <TouchableOpacity onPress={() => setHeroModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Authenticated Google identity */}
            <View style={styles.authInfoBox}>
              <Text style={styles.authInfoLabel}>AUTHENTICATED VIA GOOGLE OAUTH 2.0</Text>
              <Text style={styles.authInfoEmail}>{userEmail}</Text>
              {userName && <Text style={styles.authInfoName}>{userName}</Text>}
              <Text style={styles.authInfoClearance}>CLEARANCE: {clearanceLevel}</Text>
            </View>

            {/* Bound hero identity — read-only */}
            <View style={[styles.boundHeroCard, { borderColor: `${brandColor}60`, backgroundColor: `${brandColor}0a` }]}>
              <View style={[styles.boundAvatar, { borderColor: brandColor, backgroundColor: `${brandColor}25` }]}>
                <Text style={[styles.boundAvatarText, { color: brandColor }]}>
                  {activeHero.codename.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.boundHeroLabel}>BOUND HERO IDENTITY (IMMUTABLE)</Text>
                <Text style={styles.boundHeroName}>{activeHero.codename}</Text>
                <Text style={styles.boundHeroReal}>{activeHero.name}</Text>
                <Text style={[styles.boundHeroSector, { color: brandColor }]}>
                  📍 {activeHero.location?.label}
                </Text>
              </View>
              <View style={[styles.lockedBadge, { borderColor: `${brandColor}50` }]}>
                <Text style={[styles.lockedBadgeText, { color: brandColor }]}>🔒 LOCKED</Text>
              </View>
            </View>

            <View style={styles.lockNotice}>
              <Text style={styles.lockNoticeText}>
                ⚠ Hero identity is cryptographically bound to your Google account.{'\n'}
                To operate as a different hero, sign out and authenticate with the corresponding A.E.G.I.S. registered account.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                setHeroModalVisible(false);
                logout();
              }}>
              <Text style={styles.logoutBtnText}>🔒 REVOKE CLEARANCE & SIGN OUT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AegisColors.accentBlue} />}>
        {/* Header HUD */}
        <View style={styles.hudHeader}>
          <View style={styles.brandRow}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>CLEARANCE: VERIFIED</Text>
            </View>

            <TouchableOpacity
              style={styles.switchIdentityBtn}
              onPress={() => setHeroModalVisible(true)}>
              <Text style={styles.switchIdentityText}>🛡️ CLEARANCE / SIGN OUT</Text>
            </TouchableOpacity>
          </View>

          {/* Active Hero Profile Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setHeroModalVisible(true)}
            style={[
              styles.heroCard,
              { borderColor: `${brandColor}80` },
              Platform.OS === 'web' ? ({ boxShadow: `0 0 15px ${brandColor}30` } as any) : {},
            ]}>
            <View style={[styles.avatarGlow, { borderColor: brandColor }]}>
              <View style={[styles.avatarCore, { backgroundColor: `${brandColor}25` }]}>
                <Text style={[styles.avatarInitials, { color: brandColor }]}>
                  {activeHero.codename.substring(0, 2).toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.heroDetails}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.heroCodename}>{activeHero.codename}</Text>
                <Text style={{ fontSize: 9, color: AegisColors.textMuted }}>[VERIFIED]</Text>
              </View>
              <Text style={styles.heroRealName}>{activeHero.name} • {userEmail}</Text>
              <Text style={[styles.heroLocation, { color: brandColor }]}>
                📍 Assigned Sector: {activeHero.location?.label}
              </Text>
            </View>

            <StatusPill status={activeHero.status} />
          </TouchableOpacity>

          {/* Superpowers Bar */}
          <View style={styles.powersRow}>
            {activeHero.powers.map((p, i) => (
              <View key={i} style={[styles.powerBadge, { borderColor: `${brandColor}40`, backgroundColor: `${brandColor}10` }]}>
                <Text style={[styles.powerBadgeText, { color: brandColor }]}>{p}</Text>
              </View>
            ))}
          </View>

          {/* Status Quick Switcher */}
          <View style={styles.statusSwitcher}>
            {(['online', 'busy', 'offline'] as HeroStatus[]).map((st) => (
              <TouchableOpacity
                key={st}
                style={[
                  styles.statusBtn,
                  activeHero.status === st && { backgroundColor: `${brandColor}20`, borderColor: brandColor },
                ]}
                onPress={() => handleStatusToggle(st)}>
                <Text
                  style={[
                    styles.statusBtnText,
                    activeHero.status === st && { color: brandColor },
                  ]}>
                  {st.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tactical Voice Comms Bar */}
          <View style={[styles.voiceRadioCard, { borderColor: `${brandColor}50` }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.voiceRadioTag}>A.E.G.I.S. VOICE FREQUENCY // 144.95 MHz</Text>
              <Text style={styles.voiceRadioTitle}>TACTICAL AI VOICE DISPATCH</Text>
              <Text style={styles.voiceRadioSub}>Hold mic to transmit voice reports or ask AI</Text>
            </View>
            <MicButton
              onStartRecord={async () => {
                router.push('/chat');
              }}
              onStopRecord={async () => {}}
            />
          </View>
        </View>

        {/* Assigned Missions for Authenticated Hero */}
        <View style={{ marginBottom: 16 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: brandColor }]}>
              ⚡ DISPATCHED MISSIONS FOR {activeHero.codename.toUpperCase()}
            </Text>
            <Text style={styles.sectionBadge}>{assignedToActiveHero.length} ASSIGNED</Text>
          </View>

          {assignedToActiveHero.length > 0 ? (
            assignedToActiveHero.map((m) => (
              <MissionCard
                key={m.id}
                mission={m}
                onAccept={() => handleAcceptMission(m)}
                onStatusChange={(status) => handleMissionStatusChange(m.id, status)}
              />
            ))
          ) : (
            <View style={styles.emptyHeroMissionsCard}>
              <Text style={styles.emptyHeroIcon}>🛡️</Text>
              <Text style={styles.emptyHeroTitle}>NO ACTIVE DISPATCHES</Text>
              <Text style={styles.emptyHeroSub}>
                Standing by in {activeHero.location?.label || 'HQ Sector'}. Command Center will alert your mobile app when an emergency requiring {activeHero.codename}'s powers arises.
              </Text>
            </View>
          )}
        </View>

        {/* Demo Dispatch Trigger Button */}
        <TouchableOpacity
          style={styles.simulateAlertBtn}
          onPress={() => {
            const emergencyMission: Mission = {
              id: `m-test-${Date.now()}`,
              title: `EMERGENCY DISPATCH: ${activeHero.location?.label || 'Calicut Sector'} Hazard`,
              description: `Immediate tactical response required for ${activeHero.codename}. Structural and civilian evacuation protocol active.`,
              priority: 'critical',
              status: 'dispatched',
              location: activeHero.location || { lat: 11.2588, lng: 75.7804, label: 'Calicut Sector' },
              requiredPowers: activeHero.powers || ['Tactical Support'],
              assignedHeroId: activeHero.id,
              assignedHero: activeHero,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setIncomingMission(emergencyMission);
            setAlertVisible(true);
          }}>
          <Text style={styles.simulateAlertText}>
            ⚡ TEST MOBILE DEVICE ALERT FOR {activeHero.codename.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AegisColors.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  hudHeader: {
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(105, 240, 174, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(105, 240, 174, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AegisColors.success,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: AegisColors.success,
    letterSpacing: 0.5,
  },
  switchIdentityBtn: {
    backgroundColor: 'rgba(79, 195, 247, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.4)',
  },
  switchIdentityText: {
    fontSize: 10,
    fontWeight: '800',
    color: AegisColors.accentBlue,
    letterSpacing: 0.5,
  },
  heroCard: {
    backgroundColor: AegisColors.surface,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: 12,
    gap: 14,
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 5,
        }
      : {}),
  },
  avatarGlow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCore: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '900',
  },
  heroDetails: {
    flex: 1,
  },
  heroCodename: {
    fontSize: 17,
    fontWeight: '900',
    color: AegisColors.textPrimary,
    letterSpacing: 0.5,
  },
  heroRealName: {
    fontSize: 11,
    color: AegisColors.textSecondary,
    marginTop: 1,
  },
  heroLocation: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '700',
  },
  powersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  powerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  powerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusSwitcher: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#0a0d18',
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AegisColors.border,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: AegisColors.textMuted,
    letterSpacing: 0.8,
  },
  voiceRadioCard: {
    marginTop: 12,
    backgroundColor: '#0a0d18',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voiceRadioTag: {
    fontSize: 9,
    fontWeight: '900',
    color: AegisColors.accentBlue,
    letterSpacing: 0.8,
  },
  voiceRadioTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: AegisColors.textPrimary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  voiceRadioSub: {
    fontSize: 11,
    color: AegisColors.textSecondary,
    marginTop: 2,
  },
  emptyHeroMissionsCard: {
    backgroundColor: AegisColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AegisColors.border,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyHeroIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyHeroTitle: {
    color: AegisColors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  emptyHeroSub: {
    color: AegisColors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: AegisColors.textSecondary,
    letterSpacing: 1,
  },
  sectionBadge: {
    fontSize: 11,
    color: AegisColors.textMuted,
    fontWeight: '700',
  },
  simulateAlertBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.4)',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    alignItems: 'center',
  },
  simulateAlertText: {
    color: AegisColors.critical,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#131b31',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AegisColors.border,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: AegisColors.accentBlue,
    letterSpacing: 1,
  },
  modalClose: {
    fontSize: 18,
    color: AegisColors.textMuted,
    padding: 4,
  },
  authInfoBox: {
    backgroundColor: '#0a0e1c',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    marginVertical: 8,
    gap: 3,
  },
  authInfoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: AegisColors.accentBlue,
    letterSpacing: 0.5,
  },
  authInfoEmail: {
    fontSize: 12,
    fontWeight: '800',
    color: AegisColors.textPrimary,
  },
  authInfoName: {
    fontSize: 11,
    color: AegisColors.textSecondary,
  },
  authInfoClearance: {
    fontSize: 10,
    fontWeight: '800',
    color: AegisColors.success,
    marginTop: 2,
  },
  boundHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 12,
    marginBottom: 12,
  },
  boundAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boundAvatarText: {
    fontSize: 15,
    fontWeight: '900',
  },
  boundHeroLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: AegisColors.textMuted,
    letterSpacing: 0.5,
  },
  boundHeroName: {
    fontSize: 15,
    fontWeight: '900',
    color: AegisColors.textPrimary,
  },
  boundHeroReal: {
    fontSize: 11,
    color: AegisColors.textSecondary,
  },
  boundHeroSector: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  lockedBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  lockedBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  lockNotice: {
    backgroundColor: 'rgba(255, 193, 7, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  lockNoticeText: {
    fontSize: 11,
    color: AegisColors.textSecondary,
    lineHeight: 16,
  },
  logoutBtn: {
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 96, 0.4)',
    backgroundColor: 'rgba(255, 56, 96, 0.1)',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: AegisColors.critical,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
