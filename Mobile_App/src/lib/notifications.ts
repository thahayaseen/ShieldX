import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { updateHeroFcmTokenInSupabase } from './supabase';

// ─── Foreground notification handler ────────────────────────
// Must be set ONCE at app startup (before any notification arrives).
// This makes notifications show as banners even when the app is in foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Create the Android notification channel used for mission alerts.
 * Safe to call multiple times — Android ignores duplicate channel creation.
 */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  
  // Clean up the old broken channel that was cached by Android with an invalid sound
  try {
    await Notifications.deleteNotificationChannelAsync('missions');
  } catch (e) {
    // ignore
  }

  // Create a fresh channel to bypass Android channel caching
  await Notifications.setNotificationChannelAsync('aegis-missions', {
    name: 'Mission Alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4fc3f7',
    sound: null, // explicitly null so it uses the system default instead of looking for 'default.wav'
    enableVibrate: true,
    showBadge: true,
  });
}

let cachedRegisteredToken: string | null = null;

/**
 * Register FCM push token for the authenticated hero.
 * Called automatically upon hero login / session restoration.
 */
export async function registerHeroPushToken(heroId: string): Promise<string | null> {
  if (!heroId) return null;

  try {
    let token: string | null = null;

    if (Platform.OS === 'web') {
      // Web: persist a stable identifier in localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        let storedToken = localStorage.getItem(`aegis_fcm_token_${heroId}`);
        if (!storedToken) {
          storedToken = `fcm_web_token_${heroId.substring(0, 8)}_${Date.now()}`;
          localStorage.setItem(`aegis_fcm_token_${heroId}`, storedToken);
        }
        token = storedToken;
      }
    } else {
      // Native Android / iOS
      await ensureNotificationChannel();

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === 'granted') {
          try {
            // Expo push token works on dev builds without extra FCM config
            const tokenData = await Notifications.getExpoPushTokenAsync();
            token = tokenData.data;
          } catch {
            // Fallback: device push token (FCM direct)
            try {
              const deviceToken = await Notifications.getDevicePushTokenAsync();
              token = deviceToken.data;
            } catch (e2) {
              console.warn('[AEGIS Notifications] Could not get device push token:', e2);
            }
          }
        } else {
          console.warn('[AEGIS Notifications] Permission not granted, skipping token registration');
          return null;
        }
      } else {
        // Emulator / simulator — use placeholder
        token = `fcm_emulator_${heroId.substring(0, 8)}`;
      }
    }

    if (token && token !== cachedRegisteredToken) {
      await updateHeroFcmTokenInSupabase(heroId, token);
      cachedRegisteredToken = token;
      console.log(`[AEGIS FCM] Token registered for Hero (${heroId}):`, token);
    }

    return token;
  } catch (err) {
    console.error('[AEGIS Notifications] Error registering push token:', err);
    return null;
  }
}
