import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';
import { AegisColors } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: AegisColors.surface,
          borderTopColor: AegisColors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
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
      {/* Hide explore template screen */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
