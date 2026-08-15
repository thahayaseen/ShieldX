import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { AegisColors } from '@/constants/theme';
import { ScanlineOverlay } from './ScanlineOverlay';
import { useAuth } from '@/context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { loginWithGoogle, isLoading, authError, clearAuthError } = useAuth();

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScanlineOverlay />

      <View style={styles.content}>
        {/* ACCESS DENIED REJECTION CARD */}
        {authError ? (
          <View style={styles.deniedCard}>
            <View style={styles.deniedHeader}>
              <View style={styles.deniedRing}>
                <Text style={styles.deniedIcon}>🚫</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deniedTitle}>{authError.title}</Text>
                <Text style={styles.deniedSub}>GUARDIAN CLEARANCE // REJECTED</Text>
              </View>
            </View>

            <Text style={styles.deniedBody}>{authError.message}</Text>

            {authError.attemptedEmail && (
              <View style={styles.attemptedBox}>
                <Text style={styles.attemptedLabel}>REJECTED IDENTITY EMAIL:</Text>
                <Text style={styles.attemptedEmail}>{authError.attemptedEmail}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.retryBtn}
              onPress={handleGoogleLogin}
              disabled={isLoading}>
              <Text style={styles.retryBtnText}>
                {isLoading ? 'AUTHENTICATING...' : '🔑 TRY DIFFERENT GOOGLE ACCOUNT'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissBtn} onPress={clearAuthError}>
              <Text style={styles.dismissBtnText}>DISMISS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* STANDARD AUTH CARD */
          <>
            <View style={styles.logoArea}>
              <View style={styles.shieldRing}>
                <Text style={styles.shieldIcon}>🛡️</Text>
              </View>
              <Text style={styles.brandName}>A.E.G.I.S.</Text>
              <Text style={styles.brandFull}>Adaptive Emergency & Guardian Intelligence System</Text>
              <View style={styles.divider} />
              <Text style={styles.tagline}>S.H.I.E.L.D. OPERATIVE AUTHENTICATION REQUIRED</Text>
            </View>

            <View style={styles.authCard}>
              <Text style={styles.cardTitle}>GUARDIAN IDENTITY VERIFICATION</Text>
              <Text style={styles.cardBody}>
                Access to A.E.G.I.S. mission telemetry requires authenticated identity.{'\n'}
                Each hero is bound to their registered Google account.{'\n'}
                Unauthorized access attempts are logged and reported.
              </Text>

              <TouchableOpacity
                style={[styles.googleBtn, isLoading && styles.googleBtnDisabled]}
                onPress={handleGoogleLogin}
                disabled={isLoading}
                activeOpacity={0.8}>
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" style={{ marginRight: 10 }} />
                ) : (
                  <Text style={styles.googleIcon}>G</Text>
                )}
                <Text style={styles.googleBtnText}>
                  {isLoading ? 'CONNECTING TO GOOGLE...' : 'SIGN IN WITH GOOGLE'}
                </Text>
              </TouchableOpacity>

              <View style={styles.infoRow}>
                <Text style={styles.infoText}>🔒</Text>
                <Text style={styles.infoText}>
                  Secured via Supabase OAuth 2.0. Your hero identity is determined by your Google account email.
                  Contact your A.E.G.I.S. administrator to register a new operative.
                </Text>
              </View>
            </View>

            <View style={styles.heroSlots}>
              {[
                { code: 'SM', color: '#e53935', label: 'Spider-Man' },
                { code: 'HK', color: '#2e7d32', label: 'Hulk' },
                { code: 'TH', color: '#1565c0', label: 'Thor' },
                { code: 'IM', color: '#ff8f00', label: 'Iron Man' },
                { code: 'CA', color: '#0277bd', label: 'Captain America' },
              ].map((h) => (
                <View key={h.code} style={styles.heroSlot}>
                  <View style={[styles.slotAvatar, { borderColor: h.color, backgroundColor: `${h.color}20` }]}>
                    <Text style={[styles.slotCode, { color: h.color }]}>{h.code}</Text>
                  </View>
                  <Text style={styles.slotLabel}>{h.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.footer}>
              CLEARANCE LEVEL: RESTRICTED • A.E.G.I.S. NET-OPS DIVISION
            </Text>
          </>
        )}
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
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shieldRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: AegisColors.accentBlue,
    backgroundColor: 'rgba(79, 195, 247, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  shieldIcon: {
    fontSize: 30,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '900',
    color: AegisColors.textPrimary,
    letterSpacing: 4,
  },
  brandFull: {
    fontSize: 10,
    fontWeight: '700',
    color: AegisColors.accentBlue,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: AegisColors.border,
    marginVertical: 10,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '900',
    color: AegisColors.textMuted,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  authCard: {
    backgroundColor: AegisColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AegisColors.border,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: AegisColors.textPrimary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 11,
    color: AegisColors.textSecondary,
    lineHeight: 16,
    marginBottom: 14,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285f4',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  googleBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 10,
    color: AegisColors.textMuted,
    lineHeight: 14,
    flex: 1,
  },
  heroSlots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  heroSlot: {
    alignItems: 'center',
    gap: 4,
  },
  slotAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotCode: {
    fontSize: 11,
    fontWeight: '900',
  },
  slotLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: AegisColors.textMuted,
    maxWidth: 52,
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '800',
    color: AegisColors.textMuted,
    letterSpacing: 0.8,
  },

  // ─── DENIED CARD STYLES ─────────────────────────────────
  deniedCard: {
    backgroundColor: '#160a12',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ff3860',
    padding: 20,
  },
  deniedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 56, 96, 0.3)',
    paddingBottom: 12,
  },
  deniedRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 56, 96, 0.15)',
    borderWidth: 1.5,
    borderColor: '#ff3860',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deniedIcon: {
    fontSize: 22,
  },
  deniedTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ff3860',
    letterSpacing: 0.5,
  },
  deniedSub: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffb300',
    letterSpacing: 1,
    marginTop: 2,
  },
  deniedBody: {
    fontSize: 12,
    color: '#f0f4fc',
    lineHeight: 18,
    marginBottom: 14,
  },
  attemptedBox: {
    backgroundColor: 'rgba(255, 56, 96, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 56, 96, 0.3)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
  },
  attemptedLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: AegisColors.textMuted,
    letterSpacing: 0.5,
  },
  attemptedEmail: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ff3860',
    marginTop: 2,
  },
  retryBtn: {
    backgroundColor: '#ff3860',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dismissBtn: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AegisColors.border,
  },
  dismissBtnText: {
    color: AegisColors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
});
