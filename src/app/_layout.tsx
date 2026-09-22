import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider } from '@/core/store/game';
import { ErrorBoundary } from '@/ui/ErrorBoundary';
import { RewardHost } from '@/ui/RewardHost';
import { COLORS } from '@/ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GameProvider>
          <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg }, animation: 'fade' }}>
              <Stack.Screen name="play/[id]" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
              <Stack.Screen name="quiz/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="system" options={{ animation: 'slide_from_right' }} />
            </Stack>
            <RewardHost />
          </View>
        </GameProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
