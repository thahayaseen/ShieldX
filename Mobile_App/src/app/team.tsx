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
import { HeroBadge } from '@/components/HeroBadge';
import { StatusPill } from '@/components/StatusPill';
import { onSocketEvent } from '@/lib/socket';
import { heroesApi } from '@/lib/api';
import type { Hero, HeroStatus } from '@/types';

const INITIAL_HEROES: Hero[] = [
  {
    id: 'h-spiderman-1',
    name: 'Peter Parker',
    codename: 'Spider-Man',
    powers: ['Agility', 'Web-Slinging', 'Spider-Sense'],
    status: 'online',
    location: { lat: 11.2588, lng: 75.7804, label: 'Calicut Sector 4' },
    brandColor: '#e53935',
    createdAt: '',
    updatedAt: '',
  },
  {
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
  {
    id: 'h-ironman-1',
    name: 'Tony Stark',
    codename: 'Iron Man',
    powers: ['Flight', 'Repulsors', 'Genius Intellect', 'Armor'],
    status: 'online',
    location: { lat: 11.2721, lng: 75.8112, label: 'NH66 Bypass' },
    brandColor: '#ff8f00',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'h-hulk-1',
    name: 'Bruce Banner',
    codename: 'Hulk',
    powers: ['Strength', 'Durability', 'Leaping'],
    status: 'busy',
    location: { lat: 11.2588, lng: 75.7804, label: 'Calicut City Center' },
    brandColor: '#2e7d32',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'h-cap-1',
    name: 'Steve Rogers',
    codename: 'Captain America',
    powers: ['Shield Mastery', 'Tactics', 'Peak Human Strength'],
    status: 'offline',
    location: { lat: 11.2912, lng: 75.795, label: 'Kozhikode Beach' },
    brandColor: '#0277bd',
    createdAt: '',
    updatedAt: '',
  },
];

export default function TeamScreen() {
  const [heroes, setHeroes] = useState<Hero[]>(INITIAL_HEROES);
  const [filter, setFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchHeroes = async () => {
    try {
      const data = await heroesApi.getAll();
      if (data && data.length > 0) setHeroes(data);
    } catch {
      // fallback to mock
    }
  };

  useEffect(() => {
    fetchHeroes();

    const unsub = onSocketEvent('hero:statusChanged', ({ heroId, status }) => {
      setHeroes((prev) =>
        prev.map((h) => (h.id === heroId ? { ...h, status } : h))
      );
    });

    return unsub;
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHeroes();
    setRefreshing(false);
  };

  const filteredHeroes = heroes.filter((h) => {
    if (filter === 'ALL') return true;
    if (filter === 'ONLINE') return h.status === 'online';
    if (filter === 'ON MISSION') return h.status === 'on_mission' || h.status === 'busy';
    if (filter === 'OFFLINE') return h.status === 'offline';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScanlineOverlay />

      <View style={styles.header}>
        <Text style={styles.title}>HERO NETWORK</Text>
        <Text style={styles.subtitle}>REAL-TIME AVAILABILITY & TELEMETRY</Text>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {['ALL', 'ONLINE', 'ON MISSION', 'OFFLINE'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}>
              <Text
                style={[
                  styles.filterBtnText,
                  filter === f && styles.filterBtnTextActive,
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
        {filteredHeroes.map((hero) => (
          <View key={hero.id} style={styles.heroCard}>
            <HeroBadge hero={hero} showStatus={true} />

            {/* Powers Row */}
            <View style={styles.powersRow}>
              {hero.powers.map((p, idx) => (
                <View key={idx} style={styles.powerPill}>
                  <Text style={styles.powerText}>{p}</Text>
                </View>
              ))}
            </View>

            {/* Location Tag */}
            {hero.location?.label && (
              <Text style={styles.locationTag}>📍 {hero.location.label}</Text>
            )}
          </View>
        ))}
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
    paddingHorizontal: 10,
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
    gap: 12,
  },
  heroCard: {
    backgroundColor: AegisColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: AegisColors.border,
  },
  powersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  powerPill: {
    backgroundColor: 'rgba(121, 134, 203, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(121, 134, 203, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  powerText: {
    fontSize: 11,
    color: AegisColors.textSecondary,
    fontWeight: '600',
  },
  locationTag: {
    fontSize: 11,
    color: AegisColors.accentBlue,
    marginTop: 8,
    fontWeight: '600',
  },
});
