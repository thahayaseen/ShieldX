import '../global.css';
import { DarkTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { View, ActivityIndicator } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';
import { PendingApprovalScreen } from '@/components/PendingApprovalScreen';
import { AegisColors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isAuthenticated, isPendingApproval, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: AegisColors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={AegisColors.accentBlue} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Authenticated but hero not yet verified by admin
  if (isPendingApproval) {
    return <PendingApprovalScreen />;
  }

  return (
    <>
      <AnimatedSplashOverlay />
      <AppTabs />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
