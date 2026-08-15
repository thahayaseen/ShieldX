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
import { AegisColors, getHeroBrandColor } from '@/constants/theme';
import { ScanlineOverlay } from '@/components/ScanlineOverlay';
import { MissionCard } from '@/components/MissionCard';
import { StatusPill } from '@/components/StatusPill';
import { IncidentBanner } from '@/components/IncidentBanner';
import { onSocketEvent } from '@/lib/socket';
import { heroesApi, missionsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Hero, Mission, HeroStatus } from '@/types';

import { ALL_HEROES } from '@/constants/heroes';

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm-101',
    title: 'Building Collapse - Calicut Center',
    description: 'Structural beam failure at Commercial Complex. Multiple civilians trapped in lower levels.',
    priority: 'critical',
    status: 'pending',
    location: { lat: 11.2588, lng: 75.7804, label: 'Calicut City Center' },
    requiredPowers: ['Super Strength', 'Rubble Rescue', 'Durability'],
    assignedHeroId: 'h-hulk-1',
    assignedHero: ALL_HEROES[1],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm-102',
    title: 'Harbor High-Voltage Surge',
    description: 'Explosive electrical discharge detected at deep-water shipping dock.',
    priority: 'high',
    status: 'en_route',
    location: { lat: 11.2411, lng: 75.7725, label: 'Beypore Port' },
    requiredPowers: ['Lightning Absorption', 'Flight'],
    assignedHeroId: 'h-thor-1',
    assignedHero: ALL_HEROES[2],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm-103',
    title: 'Chemical Tanker Collision',
    description: 'Volatile containment leak on NH66 Bypass. Perimeter isolation in progress.',
    priority: 'medium',
    status: 'accepted',
    location: { lat: 11.2721, lng: 75.8112, label: 'NH66 Bypass' },
    requiredPowers: ['Armor Diagnostics', 'Flight'],
    assignedHeroId: 'h-ironman-1',
    assignedHero: ALL_HEROES[3],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function HeroDashboard() {
  const { hero: authHero, userEmail, userName, userAvatar, clearanceLevel, logout } = useAuth();
  const activeHero = authHero || ALL_HEROES[0];

  const [heroModalVisible, setHeroModalVisible] = useState(false);
  const [activeMissions, setActiveMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [incomingMission, setIncomingMission] = useState<Mission | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const brandColor = activeHero.brandColor || getHeroBrandColor(activeHero.codename);

  const fetchLiveState = async () => {
    try {
      const liveMissions = await missionsApi.getAll();
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
      setIncomingMission(mission);
      setAlertVisible(true);
      setActiveMissions((prev) => [mission, ...prev.filter((m) => m.id !== mission.id)]);
    });

    const unsubStatus = onSocketEvent('mission:statusChanged', ({ missionId, status }) => {
      setActiveMissions((prev) =>
        prev.map((m) => (m.id === missionId ? { ...m, status } : m))
      );
    });

    return () => {
      unsubMission();
      unsubStatus();
    };
  }, []);

  const handleStatusToggle = async (nextStatus: HeroStatus) => {
    try {
      await heroesApi.updateStatus(activeHero.id, nextStatus);
    } catch {}
  };

  // Hero identity is locked to the authenticated Google account.
  // To change hero, the operative must sign out and log in with a different account.

  const handleAcceptMission = async (mission: Mission) => {
    setAlertVisible(false);
    setIncomingMission(null);
    try {
      await missionsApi.updateStatus(mission.id, 'accepted');
    } catch {}
    setActiveMissions((prev) =>
      prev.map((m) => (m.id === mission.id ? { ...m, status: 'accepted' } : m))
    );
  };

  const handleMissionStatusChange = async (missionId: string, status: Mission['status']) => {
    try {
      await missionsApi.updateStatus(missionId, status);
    } catch {}
    setActiveMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, status } : m))
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLiveState();
    setRefreshing(false);
  };

  // Missions assigned specifically to this authenticated hero
  const assignedToActiveHero = activeMissions.filter(
    (m) => m.assignedHeroId === activeHero.id
  );

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
        </View>

        {/* Assigned Missions for Authenticated Hero */}
        {assignedToActiveHero.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: brandColor }]}>
                ⚡ ASSIGNED DIRECTLY TO {activeHero.codename.toUpperCase()}
              </Text>
            </View>
            {assignedToActiveHero.map((m) => (
              <MissionCard
                key={`direct-${m.id}`}
                mission={m}
                onAccept={() => handleAcceptMission(m)}
                onStatusChange={(status) => handleMissionStatusChange(m.id, status)}
              />
            ))}
          </View>
        )}

        {/* All Sector Missions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ALL SECTOR EMERGENCIES</Text>
          <Text style={styles.sectionBadge}>{activeMissions.length} TOTAL</Text>
        </View>

        {activeMissions.map((m) => (
          <MissionCard
            key={m.id}
            mission={m}
            onAccept={() => handleAcceptMission(m)}
            onStatusChange={(status) => handleMissionStatusChange(m.id, status)}
          />
        ))}

        {/* Demo Dispatch Trigger Button */}
        <TouchableOpacity
          style={styles.simulateAlertBtn}
          onPress={() => {
            const emergencyMission =
              activeHero.codename === 'Hulk'
                ? INITIAL_MISSIONS[0]
                : activeHero.codename === 'Thor'
                ? INITIAL_MISSIONS[1]
                : INITIAL_MISSIONS[2];
            setIncomingMission(emergencyMission);
            setAlertVisible(true);
          }}>
          <Text style={styles.simulateAlertText}>
            ⚡ TEST WRISTBAND ALERT FOR {activeHero.codename.toUpperCase()}
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
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: 10,
    gap: 12,
  },
  avatarGlow: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCore: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 16,
    fontWeight: '900',
    color: AegisColors.textPrimary,
  },
  heroRealName: {
    fontSize: 11,
    color: AegisColors.textSecondary,
  },
  heroLocation: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '700',
  },
  powersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  powerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  powerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusSwitcher: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: AegisColors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AegisColors.border,
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: AegisColors.textSecondary,
    letterSpacing: 0.8,
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
