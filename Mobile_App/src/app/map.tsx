import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { AegisColors } from '@/constants/theme';
import { ScanlineOverlay } from '@/components/ScanlineOverlay';

interface MapPin {
  id: string;
  label: string;
  type: 'incident' | 'hero';
  title: string;
  status: string;
  sector: string;
}

const SAMPLE_PINS: MapPin[] = [
  {
    id: 'p-1',
    label: 'SECTOR-01',
    type: 'incident',
    title: 'Building Collapse',
    status: 'CRITICAL',
    sector: 'Calicut City Center',
  },
  {
    id: 'p-2',
    label: 'SECTOR-04',
    type: 'hero',
    title: 'Spider-Man Deployed',
    status: 'ACTIVE',
    sector: 'Mavoor Road',
  },
  {
    id: 'p-3',
    label: 'SECTOR-09',
    type: 'incident',
    title: 'Energy Surge at Port',
    status: 'HIGH',
    sector: 'Beypore Port',
  },
  {
    id: 'p-4',
    label: 'SECTOR-02',
    type: 'hero',
    title: 'Thor In Transit',
    status: 'EN ROUTE',
    sector: 'Beach Airspace',
  },
];

export default function MapScreen() {
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(SAMPLE_PINS[0]);

  return (
    <SafeAreaView style={styles.container}>
      <ScanlineOverlay />

      <View style={styles.header}>
        <Text style={styles.title}>TACTICAL RADAR</Text>
        <Text style={styles.subtitle}>SATELLITE SECTOR GRID & DEPLOYMENTS</Text>
      </View>

      {/* Retro HUD Radar Visualization */}
      <View style={styles.radarContainer}>
        <View style={styles.radarCircleOuter}>
          <View style={styles.radarCircleMid}>
            <View style={styles.radarCircleInner}>
              <View style={styles.radarCrossH} />
              <View style={styles.radarCrossV} />

              {/* Blip 1: Incident */}
              <TouchableOpacity
                style={[styles.blip, styles.blipCritical, { top: '30%', left: '45%' }]}
                onPress={() => setSelectedPin(SAMPLE_PINS[0])}>
                <Text style={styles.blipText}>🚨</Text>
              </TouchableOpacity>

              {/* Blip 2: Hero */}
              <TouchableOpacity
                style={[styles.blip, styles.blipHero, { top: '55%', left: '35%' }]}
                onPress={() => setSelectedPin(SAMPLE_PINS[1])}>
                <Text style={styles.blipText}>🕷️</Text>
              </TouchableOpacity>

              {/* Blip 3: Incident */}
              <TouchableOpacity
                style={[styles.blip, styles.blipWarning, { top: '65%', left: '70%' }]}
                onPress={() => setSelectedPin(SAMPLE_PINS[2])}>
                <Text style={styles.blipText}>⚡</Text>
              </TouchableOpacity>

              {/* Blip 4: Hero */}
              <TouchableOpacity
                style={[styles.blip, styles.blipHero, { top: '25%', left: '75%' }]}
                onPress={() => setSelectedPin(SAMPLE_PINS[3])}>
                <Text style={styles.blipText}>🔨</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Selected Target Detail Panel */}
      <ScrollView contentContainerStyle={styles.detailContainer}>
        {selectedPin && (
          <View
            style={[
              styles.pinCard,
              {
                borderColor:
                  selectedPin.status === 'CRITICAL'
                    ? AegisColors.critical
                    : selectedPin.type === 'hero'
                    ? AegisColors.accentBlue
                    : AegisColors.accentAmber,
              },
            ]}>
            <View style={styles.pinHeader}>
              <Text style={styles.pinSector}>{selectedPin.label} // {selectedPin.sector.toUpperCase()}</Text>
              <Text
                style={[
                  styles.pinStatus,
                  {
                    color:
                      selectedPin.status === 'CRITICAL'
                        ? AegisColors.critical
                        : AegisColors.accentBlue,
                  },
                ]}>
                {selectedPin.status}
              </Text>
            </View>

            <Text style={styles.pinTitle}>{selectedPin.title}</Text>
            <Text style={styles.pinMeta}>
              Type: {selectedPin.type.toUpperCase()} • Telemetry Live
            </Text>
          </View>
        )}

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: AegisColors.critical }]} />
            <Text style={styles.legendText}>Critical Emergency</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: AegisColors.accentBlue }]} />
            <Text style={styles.legendText}>Active Hero</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: AegisColors.accentAmber }]} />
            <Text style={styles.legendText}>High Alert</Text>
          </View>
        </View>
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
  },
  radarContainer: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0d17',
    borderBottomWidth: 1,
    borderBottomColor: AegisColors.border,
  },
  radarCircleOuter: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCircleMid: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCircleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCrossH: {
    position: 'absolute',
    width: 240,
    height: 1,
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
  },
  radarCrossV: {
    position: 'absolute',
    height: 240,
    width: 1,
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
  },
  blip: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  blipCritical: {
    backgroundColor: 'rgba(255, 82, 82, 0.3)',
    borderColor: AegisColors.critical,
  },
  blipWarning: {
    backgroundColor: 'rgba(255, 213, 79, 0.3)',
    borderColor: AegisColors.accentAmber,
  },
  blipHero: {
    backgroundColor: 'rgba(79, 195, 247, 0.3)',
    borderColor: AegisColors.accentBlue,
  },
  blipText: {
    fontSize: 12,
  },
  detailContainer: {
    padding: 16,
  },
  pinCard: {
    backgroundColor: AegisColors.surface,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  pinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pinSector: {
    fontSize: 10,
    fontWeight: '800',
    color: AegisColors.textSecondary,
    letterSpacing: 0.8,
  },
  pinStatus: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  pinTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AegisColors.textPrimary,
    marginBottom: 4,
  },
  pinMeta: {
    fontSize: 12,
    color: AegisColors.textMuted,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: AegisColors.textSecondary,
    fontWeight: '600',
  },
});
