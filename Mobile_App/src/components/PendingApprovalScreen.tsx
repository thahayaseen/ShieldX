import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { AegisColors } from '@/constants/theme';
import { ScanlineOverlay } from './ScanlineOverlay';
import { useAuth } from '@/context/AuthContext';

/**
 * Shown to heroes who have logged in via Google for the first time
 * but whose hero profile has not yet been verified/updated by the
 * A.E.G.I.S. Command Center administrator.
 */
export const PendingApprovalScreen: React.FC = () => {
  const { userEmail, userName, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScanlineOverlay />

      <View style={styles.content}>
        {/* Header emblem */}
        <View style={styles.emblemRing}>
          <Text style={styles.emblemIcon}>⏳</Text>
        </View>

        <Text style={styles.title}>IDENTITY VERIFICATION</Text>
        <Text style={styles.subtitle}>PENDING ADMIN CLEARANCE</Text>

        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.pulsingDot} />
            <Text style={styles.statusText}>AWAITING COMMANDER AUTHORIZATION</Text>
          </View>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>GOOGLE IDENTITY REGISTERED</Text>
          <Text style={styles.infoEmail}>{userEmail}</Text>
          {userName && userName !== 'Unknown Hero' && (
            <Text style={styles.infoName}>{userName}</Text>
          )}
        </View>

        <Text style={styles.message}>
          Your Google account has been registered in the A.E.G.I.S. Superhero Registry.{'\n\n'}
          A Command Center administrator will review your profile and assign your hero identity.{'\n\n'}
          Once verified, you will have full mission access.
        </Text>

        {/* Steps */}
        <View style={styles.stepsBox}>
          <View style={styles.step}>
            <View style={[styles.stepDot, { backgroundColor: AegisColors.success }]} />
            <Text style={styles.stepText}>Google account authenticated ✓</Text>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepDot, { backgroundColor: AegisColors.success }]} />
            <Text style={styles.stepText}>Hero profile created in registry ✓</Text>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepDot, { backgroundColor: '#ffb300' }]} />
            <Text style={[styles.stepText, { color: '#ffb300' }]}>
              Admin identity verification — PENDING
            </Text>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepDot, { backgroundColor: AegisColors.textMuted }]} />
            <Text style={[styles.stepText, { color: AegisColors.textMuted }]}>
              Mission clearance unlocked
            </Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          disabled={isLoggingOut}>
          {isLoggingOut ? (
            <ActivityIndicator color={AegisColors.critical} size="small" />
          ) : (
            <Text style={styles.logoutText}>SIGN OUT</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AegisColors.bg,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 179, 0, 0.1)',
    borderWidth: 2,
    borderColor: '#ffb300',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emblemIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: AegisColors.textPrimary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffb300',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 179, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    width: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffb300',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffb300',
    letterSpacing: 0.8,
  },
  infoBox: {
    backgroundColor: AegisColors.surface,
    borderWidth: 1,
    borderColor: AegisColors.border,
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    gap: 2,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: AegisColors.accentBlue,
    letterSpacing: 0.8,
  },
  infoEmail: {
    fontSize: 13,
    fontWeight: '800',
    color: AegisColors.textPrimary,
    marginTop: 2,
  },
  infoName: {
    fontSize: 11,
    color: AegisColors.textSecondary,
  },
  message: {
    fontSize: 12,
    color: AegisColors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  stepsBox: {
    width: '100%',
    backgroundColor: AegisColors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AegisColors.border,
    padding: 14,
    gap: 10,
    marginBottom: 24,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  stepText: {
    fontSize: 11,
    color: AegisColors.textPrimary,
    fontWeight: '700',
  },
  logoutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 96, 0.35)',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: AegisColors.critical,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
