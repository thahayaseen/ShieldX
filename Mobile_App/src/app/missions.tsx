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
import { updateMissionStatusInSupabase } from '@/lib/supabase';
import type { Mission, Priority } from '@/types';

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm-101',
    title: 'Building Collapse - Downtown',
    description: 'Structural failure at Calicut Commercial Complex. Civilians trapped on floor 4.',
    priority: 'critical',
    status: 'pending',
    location: { lat: 11.2588, lng: 75.7804, label: 'Calicut City Center' },
    requiredPowers: ['Strength', 'Rescue', 'Durability'],
    assignedHeroId: 'h-hulk-1',
    assignedHero: {
      id: 'h-hulk-1',
      name: 'Bruce Banner',
      codename: 'Hulk',
      powers: ['Strength', 'Durability', 'Leaping'],
      status: 'on_mission',
      location: { lat: 11.2588, lng: 75.7804, label: 'Calicut City Center' },
      brandColor: '#2e7d32',
      createdAt: '',
      updatedAt: '',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm-102',
    title: 'Harbor Energy Anomaly',
    description: 'High-voltage surge detected near deep-water terminal.',
    priority: 'high',
    status: 'en_route',
    location: { lat: 11.2411, lng: 75.7725, label: 'Beypore Port' },
    requiredPowers: ['Energy Absorption', 'Flight'],
    assignedHeroId: 'h-thor-1',
    assignedHero: {
      id: 'h-thor-1',
      name: 'Thor Odinson',
      codename: 'Thor',
      powers: ['Lightning', 'Flight', 'Super Strength'],
      status: 'on_mission',
      location: { lat: 11.2411, lng: 75.7725, label: 'Beypore Port' },
      brandColor: '#1565c0',
      createdAt: '',
      updatedAt: '',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm-103',
    title: 'Highway Chemical Spill',
    description: 'Tanker collision on NH66 Bypass. Hazardous containment required.',
    priority: 'medium',
    status: 'accepted',
    location: { lat: 11.2721, lng: 75.8112, label: 'NH66 Bypass' },
    requiredPowers: ['Containment', 'Tech'],
    assignedHeroId: 'h-ironman-1',
    assignedHero: {
      id: 'h-ironman-1',
      name: 'Tony Stark',
      codename: 'Iron Man',
      powers: ['Flight', 'Repulsors', 'Genius Intellect', 'Armor'],
      status: 'on_mission',
      location: { lat: 11.2721, lng: 75.8112, label: 'NH66 Bypass' },
      brandColor: '#ff8f00',
      createdAt: '',
      updatedAt: '',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function MissionsScreen() {
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchMissions = async () => {
    try {
      const data = await missionsApi.getAll();
      if (data && data.length > 0) setMissions(data);
    } catch {
      // keep fallback
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

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

  const filteredMissions = missions.filter((m) => {
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
        <Text style={styles.subtitle}>COMMAND & DISPATCH ROSTER</Text>

        {/* Priority Filter Bar */}
        <View style={styles.filterRow}>
          {['ALL', 'CRITICAL', 'ACTIVE', 'PENDING'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                selectedFilter === f && styles.filterBtnActive,
              ]}
              onPress={() => setSelectedFilter(f)}>
              <Text
                style={[
                  styles.filterBtnText,
                  selectedFilter === f && styles.filterBtnTextActive,
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
        {filteredMissions.length === 0 ? (
          <View style={styles.emptyView}>
            <Text style={styles.emptyText}>NO MISSIONS FOUND IN THIS FILTER</Text>
          </View>
        ) : (
          filteredMissions.map((m) => (
            <MissionCard
              key={m.id}
              mission={m}
              onStatusChange={(st) => handleStatusChange(m.id, st)}
            />
          ))
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
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AegisColors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: AegisColors.textPrimary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 10,
    color: AegisColors.accentBlue,
    fontWeight: '700',
    letterSpacing: 0.8,
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
    backgroundColor: AegisColors.surface,
    borderWidth: 1,
    borderColor: AegisColors.border,
  },
  filterBtnActive: {
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
    borderColor: AegisColors.accentBlue,
  },
  filterBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: AegisColors.textSecondary,
    letterSpacing: 0.5,
  },
  filterBtnTextActive: {
    color: AegisColors.accentBlue,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyView: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: AegisColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
