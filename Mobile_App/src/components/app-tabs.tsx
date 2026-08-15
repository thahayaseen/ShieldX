import { Tabs, useRouter } from 'expo-router';
import { Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AegisColors } from '@/constants/theme';

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Navigate to the right tab when user taps a push notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      if (data?.screen === 'missions') router.push('/missions');
      else if (data?.screen === 'chat') router.push('/chat');
      else if (data?.screen === 'map') router.push('/map');
      else if (data?.screen === 'team') router.push('/team');
      else router.push('/');
    });

    return () => {
      responseListener.current?.remove();
    };
  }, []);

  // Bottom padding: respect system gesture nav bar on Android, home indicator on iOS
  const tabBarHeight = Platform.OS === 'ios' ? 50 : 56;
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 4 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: AegisColors.surface,
          borderTopColor: AegisColors.border,
          borderTopWidth: 1,
          height: tabBarHeight + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 8,
        },
        tabBarActiveTintColor: AegisColors.accentBlue,
        tabBarInactiveTintColor: AegisColors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'DASHBOARD',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>⚡</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: 'MISSIONS',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>🎯</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'TEAM',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>🛡️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'MAP',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>📍</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI COMMS',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>🤖</Text>
          ),
        }}
      />
      {/* Hide non-tab screens */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="callback" options={{ href: null }} />
    </Tabs>
  );
}
