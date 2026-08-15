// ============================================================
// A.E.G.I.S. – OAuth Callback Route
// tinkerproject://auth/callback  (Android deep link handler)
//
// On Android, Google OAuth redirects back to the app via the
// custom scheme. Android opens the app directly via intent,
// so Expo Router lands here. We extract the tokens from the
// URL fragment and establish the Supabase session.
// ============================================================

import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { AegisColors } from '@/constants/theme';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      // The URL fragment (#access_token=...) is not exposed via
      // useLocalSearchParams – we need to read the full URL from Linking.
      const url = await Linking.getInitialURL();
      if (!url) {
        console.warn('[AEGIS Callback] No initial URL found');
        router.replace('/');
        return;
      }

      // Extract the fragment portion which contains the tokens
      const fragment = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
      const searchParams = new URLSearchParams(fragment ?? '');
      const access_token = searchParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token');

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) {
          console.error('[AEGIS Callback] setSession error:', error.message);
        } else {
          console.log('[AEGIS Callback] Session established successfully');
        }
      } else {
        // Check if a code param is present (PKCE flow)
        const code = searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('[AEGIS Callback] exchangeCodeForSession error:', error.message);
          }
        } else {
          console.warn('[AEGIS Callback] No tokens or code in callback URL:', url);
        }
      }
    } catch (err: any) {
      console.error('[AEGIS Callback] Unexpected error:', err.message);
    }

    // Always navigate back to root — AuthContext will react to the session change
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator color={AegisColors.accentBlue} size="large" />
      <Text style={styles.label}>AUTHENTICATING OPERATIVE...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AegisColors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: AegisColors.textMuted,
    letterSpacing: 1.5,
  },
});
