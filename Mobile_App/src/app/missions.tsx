import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { AegisColors } from '@/constants/theme';
import { ScanlineOverlay } from '@/components/ScanlineOverlay';
import { MissionCard } from '@/components/MissionCard';
import { missionsApi } from '@/lib/api';
import { updateMissionStatusInSupabase, subscribeToTable } from '@/lib/supabase';
import { triggerEmergencyDispatchAlert } from '@/lib/sound';
import { useAuth } from '@/context/AuthContext';
import { ALL_HEROES } from '@/constants/heroes';
import type { Mission } from '@/types';

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm-101',
    title: 'Building Collapse - Calicut Center',
    description: 'Structural beam failure at Commercial Complex. Multiple civilians trapped in lower levels.',
    priority: 'critical',
    status: 'pending',
    location: { lat: 11.2588, lng: 75.7804, label: 'Calicut City Center' },
    requiredPowers: ['Super Strength', 'Rubble Rescue', 'Durability'],
    assignedHeroId: '11111111-0000-0000-0000-000000000001',
    assignedHero: ALL_HEROES[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function MissionsScreen() {
  const { hero: authHero } = useAuth();
  const activeHero = authHero || ALL_HEROES[0];

  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CRITICAL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchMissions = async () => {
    try {
      const data = await missionsApi.getAll();
      if (data && data.length > 0) {
        setMissions(data);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchMissions();

    // Supabase Realtime listener for new mission dispatches
    const unsubRealtimeMissions = subscribeToTable('missions', '*', (payload) => {
      if (payload.new) {
        const raw: any = payload.new;
        const isForThisHero =
          raw.assigned_hero_id === activeHero.id ||
          raw.assignedHeroId === activeHero.id;

        if (isForThisHero) {
          triggerEmergencyDispatchAlert();
          fetchMissions();
        }
      }
    });

    return () => {
      unsubRealtimeMissions.unsubscribe();
    };
  }, [activeHero.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMissions();
    setRefreshing(false);
  };

  const handleStatusChange = async (missionId: string, status: Mission['status']) => {
    try {
      await updateMissionStatusInSupabase(missionId, status);
    } catch {
      // update local
    }
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, status } : m))
    );
  };

  // Strictly list ONLY missions dispatched to THIS hero
  const heroOnlyMissions = missions.filter((m) => {
    if (!m) return false;
    const matchesId = m.assignedHeroId === activeHero.id;
    const matchesCodename =
      m.assignedHero?.codename?.toLowerCase() === activeHero.codename?.toLowerCase();
    return matchesId || matchesCodename;
  });

  const filteredMissions = heroOnlyMissions.filter((m) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'CRITICAL') return m.priority === 'critical';
    if (selectedFilter === 'ACTIVE') return m.status === 'en_route' || m.status === 'accepted';
    if (selectedFilter === 'PENDING') return m.status === 'pending';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScanlineOverlay />

      <View style={styles.header}>
        <Text style={styles.title}>TACTICAL MISSIONS</Text>
        <Text style={styles.subtitle}>
          DISPATCHED TO {activeHero.codename.toUpperCase()} // SECTOR ROSTER
        </Text>

        {/* Priority Filter Bar */}
        <View style={styles.filterRow}>
          {(['ALL', 'CRITICAL', 'ACTIVE', 'PENDING'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                selectedFilter === f && styles.filterBtnActive,
              ]}
              onPress={() => setSelectedFilter(f)}>
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === f && styles.filterTextActive,
                ]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AegisColors.accentBlue} />}>
        {filteredMissions.length > 0 ? (
          filteredMissions.map((m) => (
            <MissionCard
              key={m.id}
              mission={m}
              onStatusChange={(status) => handleStatusChange(m.id, status)}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🛡️</Text>
            <Text style={styles.emptyTitle}>NO DISPATCHED MISSIONS</Text>
            <Text style={styles.emptySub}>
              No emergency missions are currently dispatched to {activeHero.codename}. Standing by for Command Center signals.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AegisColors.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AegisColors.border,
    backgroundColor: AegisColors.surface,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: AegisColors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: AegisColors.accentBlue,
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AegisColors.border,
    backgroundColor: 'transparent',
  },
  filterBtnActive: {
    borderColor: AegisColors.accentBlue,
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
  },
  filterText: {
    fontSize: 10,
    fontWeight: '800',
    color: AegisColors.textMuted,
    letterSpacing: 0.8,
  },
  filterTextActive: {
    color: AegisColors.accentBlue,
  },
  scrollContent: {
    padding: 16,
  },
  emptyCard: {
    backgroundColor: AegisColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AegisColors.border,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    color: AegisColors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  emptySub: {
    color: AegisColors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
