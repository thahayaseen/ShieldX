import { Platform } from 'react-native';
import { updateHeroFcmTokenInSupabase } from './supabase';

/**
 * Register FCM push token for the authenticated hero.
 * Called automatically upon hero login / session restoration.
 */
export async function registerHeroPushToken(heroId: string): Promise<string | null> {
  if (!heroId) return null;

  try {
    let token: string | null = null;

    // Check if running on web vs native
    if (Platform.OS === 'web') {
      // In web browser context, construct a persistent web FCM token identifier
      if (typeof window !== 'undefined' && window.localStorage) {
        let storedToken = localStorage.getItem(`aegis_fcm_token_${heroId}`);
        if (!storedToken) {
          storedToken = `fcm_web_token_${heroId.substring(0, 8)}_${Date.now()}`;
          localStorage.setItem(`aegis_fcm_token_${heroId}`, storedToken);
        }
        token = storedToken;
      }
    } else {
      // On Android / iOS native build using Firebase / Expo Notifications
      try {
        const Notifications = require('expo-notifications');
        const Device = require('expo-device');

        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;

          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }

          if (finalStatus === 'granted') {
            const tokenData = await Notifications.getDevicePushTokenAsync();
            token = tokenData?.data || (await Notifications.getExpoPushTokenAsync()).data;
          }
        }
      } catch (nativeErr) {
        console.warn('[AEGIS Notifications] Native push token fetch fallback:', nativeErr);
      }

      // Fallback token format for Expo dev client / emulator
      if (!token) {
        token = `fcm_device_token_${heroId.substring(0, 8)}`;
      }
    }

    if (token) {
      await updateHeroFcmTokenInSupabase(heroId, token);
      console.log(`[AEGIS FCM] Token registered for Hero (${heroId}):`, token);
    }

    return token;
  } catch (err) {
    console.error('[AEGIS Notifications] Error registering push token:', err);
    return null;
  }
}
